import Foundation
import Observation

@MainActor @Observable
final class CatalogStore {
    private(set) var catalog: Catalog?
    private(set) var isLoading = false
    private(set) var message: String?
    private(set) var isSavedCopy = true
    private let endpoint: URL
    private let session: URLSession
    private let cacheURL: URL?

    init(endpoint: URL = URL(string: "https://voltura-projects-drab.vercel.app/api/catalog")!,
         session: URLSession = .shared, cacheURL: URL? = nil) {
        self.endpoint = endpoint
        self.session = session
        self.cacheURL = cacheURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?.appendingPathComponent("VolturaProjects/catalog.json")
        let decoder = JSONDecoder()
        if let cache = self.cacheURL, let data = try? Data(contentsOf: cache),
           let saved = try? decoder.decode(Catalog.self, from: data), ISODate.parse(saved.refreshedAt) != nil {
            catalog = saved
        } else if let seed = Bundle.main.url(forResource: "catalog", withExtension: "json"),
                  let data = try? Data(contentsOf: seed) {
            catalog = try? decoder.decode(Catalog.self, from: data)
        }
    }

    func refresh() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            var request = URLRequest(url: endpoint, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 25)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            let (data, response) = try await session.data(for: request)
            try Task.checkCancellation()
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            let incoming = try JSONDecoder().decode(Catalog.self, from: data)
            guard ISODate.parse(incoming.refreshedAt) != nil,
                  Set(incoming.projects.map(\.id)).count == incoming.projects.count else {
                throw URLError(.cannotParseResponse)
            }
            // A service fallback must never overwrite a newer on-device catalog.
            guard incoming.status != "unavailable" else { throw URLError(.resourceUnavailable) }
            catalog = incoming
            isSavedCopy = false
            message = incoming.status == "delayed" ? "GitHub refresh delayed. Showing saved projects." : nil
            if let cacheURL {
                do {
                    try FileManager.default.createDirectory(at: cacheURL.deletingLastPathComponent(), withIntermediateDirectories: true)
                    try data.write(to: cacheURL, options: .atomic)
                } catch {
                    message = "Projects loaded, but this device could not save an offline copy."
                }
            }
        } catch {
            guard !Task.isCancelled else { return }
            isSavedCopy = true
            message = catalog == nil ? "Could not load projects. Check your connection and try again." : "Connection unavailable. Showing the saved catalog."
        }
    }

    /// Only runs while the scene is active. A pull refresh reads the catalog;
    /// it does not bypass the backend's six-hour GitHub refresh interval.
    func pollWhileActive() async {
        while !Task.isCancelled {
            await refresh()
            let seconds: UInt64 = isSavedCopy || catalog?.status == "delayed" ? 60 : (catalog?.refreshing == true ? 5 : 300)
            do { try await Task.sleep(nanoseconds: seconds * 1_000_000_000) }
            catch { return }
        }
    }
}
