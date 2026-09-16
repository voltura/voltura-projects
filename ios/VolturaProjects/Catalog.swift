import Foundation

struct Catalog: Codable, Sendable {
    var projects: [Project]
    var refreshedAt: String
    var refreshing: Bool?
    var status: String?
    var nextRefresh: Date? { ISODate.parse(refreshedAt)?.addingTimeInterval(6 * 60 * 60) }
}

struct Project: Codable, Identifiable, Sendable {
    let id: Int
    let name: String
    let title: String
    let description: String?
    let url: String
    let language: String?
    let topics: [String]
    let stars: Int
    let updated: String
    let created: String
    let archived: Bool
    let images: [ProjectImage]
    let links: [ProjectLink]

    var displayDescription: String {
        let text = description?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return text.isEmpty ? "Explore the source code on GitHub." : text
    }

    var destinations: [ProjectLink] {
        var seen = Set<String>()
        return ([ProjectLink(url: url, kind: "GitHub", label: "GitHub")] + links)
            .filter { WebURL.parse($0.url) != nil && seen.insert($0.url).inserted }
    }
}

struct ProjectImage: Codable, Hashable, Sendable {
    let url: String
    let alt: String
}

struct ProjectLink: Codable, Hashable, Identifiable, Sendable {
    let url: String
    let kind: String
    let label: String?
    var id: String { url }
    var symbol: String {
        switch kind {
        case "GitHub": "chevron.left.forwardslash.chevron.right"
        case "YouTube": "play.rectangle"
        case "Pinterest": "pin"
        default: "globe"
        }
    }
}

enum WebURL {
    static func parse(_ raw: String) -> URL? {
        guard let url = URL(string: raw),
              let scheme = url.scheme?.lowercased(),
              ["https", "http"].contains(scheme),
              url.host != nil, url.user == nil, url.password == nil else { return nil }
        return url
    }
}

enum ISODate {
    static func parse(_ value: String) -> Date? {
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = parser.date(from: value) { return date }
        parser.formatOptions = [.withInternetDateTime]
        return parser.date(from: value)
    }
}

enum ProjectSort: String, CaseIterable, Identifiable {
    case updated, name, stars, created
    var id: String { rawValue }
    var title: String {
        switch self {
        case .updated: "Recently updated"
        case .name: "Name A–Z"
        case .stars: "Most stars"
        case .created: "Newest created"
        }
    }

    func apply(to projects: [Project], query: String) -> [Project] {
        let terms = query.lowercased().split(whereSeparator: \.isWhitespace)
        let matches = projects.filter { project in
            let text = ([project.name, project.title, project.description ?? "", project.language ?? ""] + project.topics)
                .joined(separator: " ").lowercased()
            return terms.allSatisfy { text.contains($0) }
        }
        return matches.sorted { left, right in
            let alpha = left.name.compare(right.name, options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en"))
            let tie = alpha == .orderedSame ? left.id < right.id : alpha == .orderedAscending
            switch self {
            case .name: return tie
            case .stars: return left.stars == right.stars ? tie : left.stars > right.stars
            case .updated, .created:
                let l = ISODate.parse(self == .created ? left.created : left.updated) ?? .distantPast
                let r = ISODate.parse(self == .created ? right.created : right.updated) ?? .distantPast
                return l == r ? tie : l > r
            }
        }
    }
}
