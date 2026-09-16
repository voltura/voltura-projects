import SwiftUI

struct ProjectCard: View {
    let project: Project

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ProjectArtwork(images: project.images, title: project.title)
            VStack(alignment: .leading, spacing: 14) {
                Text(project.title).font(.title3.bold()).accessibilityAddTraits(.isHeader)
                HStack(spacing: 14) {
                    Label("\(project.stars)", systemImage: "star")
                        .accessibilityLabel("\(project.stars) stars")
                    if project.archived { Label("Archived", systemImage: "archivebox") }
                }.font(.subheadline).foregroundStyle(.secondary)
                Text(project.displayDescription).font(.body).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                ViewThatFits(in: .horizontal) {
                    HStack { metadata }
                    VStack(alignment: .leading, spacing: 4) { metadata }
                }.font(.footnote).foregroundStyle(.secondary)
                Divider()
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(project.destinations) { link in
                        if let url = WebURL.parse(link.url) {
                            Link(destination: url) {
                                HStack(alignment: .firstTextBaseline) {
                                    Label(linkTitle(link), systemImage: link.symbol)
                                        .multilineTextAlignment(.leading)
                                    Spacer(minLength: 8)
                                    Image(systemName: "arrow.up.right").accessibilityHidden(true)
                                }
                                .frame(minHeight: 44)
                                .contentShape(Rectangle())
                            }
                            .accessibilityLabel("\(project.title): \(linkTitle(link))")
                        }
                    }
                }
            }.padding([.horizontal, .bottom], 18)
        }
        .background(Color(red: 0.098, green: 0.11, blue: 0.133))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.12)))
    }

    @ViewBuilder private var metadata: some View {
        Text(project.language ?? "Repository")
        if let date = ISODate.parse(project.updated) {
            Text("Updated \(date.formatted(date: .abbreviated, time: .omitted))")
        }
    }

    private func linkTitle(_ link: ProjectLink) -> String {
        let siblings = project.destinations.filter { $0.kind == link.kind }
        guard siblings.count > 1 else { return link.kind }
        let index = (siblings.firstIndex(of: link) ?? 0) + 1
        if let label = link.label, !label.isEmpty, label != link.kind { return "\(link.kind) · \(label)" }
        return "\(link.kind) \(index)"
    }
}

struct ProjectArtwork: View {
    let images: [ProjectImage]
    let title: String
    @State private var index = 0

    var body: some View {
        Group {
            if index < images.count, let url = WebURL.parse(images[index].url), url.scheme == "https" {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFit().padding(16)
                            .accessibilityLabel(images[index].alt.isEmpty ? title : images[index].alt)
                    case .failure:
                        placeholder.task { index += 1 }
                    default:
                        ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }.id(index)
            } else if index < images.count {
                placeholder.task { index += 1 }
            } else {
                placeholder
            }
        }
        .frame(height: 220)
        .frame(maxWidth: .infinity)
        .background(Color(red: 0.11, green: 0.145, blue: 0.2))
        .onChange(of: images) { _, _ in index = 0 }
    }

    private var placeholder: some View {
        VStack(spacing: 12) {
            Image(systemName: "chevron.left.forwardslash.chevron.right").font(.largeTitle)
            Text("Source available").font(.subheadline)
        }
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityLabel("No artwork available for \(title)")
    }
}
