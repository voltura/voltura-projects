import SwiftUI

struct GalleryView: View {
    @State private var store = CatalogStore()
    @State private var query = ""
    @State private var sort = ProjectSort.updated
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dynamicTypeSize) private var typeSize

    private var projects: [Project] { sort.apply(to: store.catalog?.projects ?? [], query: query) }
    private var columns: [GridItem] {
        typeSize.isAccessibilitySize ? [GridItem(.flexible())] : [GridItem(.adaptive(minimum: 310), spacing: 18)]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    introduction
                    HStack {
                        Text("\(projects.count) \(query.isEmpty ? "projects" : "matching projects")")
                            .font(.subheadline).foregroundStyle(.secondary)
                            .accessibilityIdentifier("resultCount")
                        Spacer()
                        if store.isLoading { ProgressView().accessibilityLabel("Loading catalog") }
                    }
                    if projects.isEmpty {
                        emptyState
                    } else {
                        LazyVGrid(columns: columns, spacing: 18) {
                            ForEach(projects) { ProjectCard(project: $0) }
                        }
                    }
                    RefreshFooter(catalog: store.catalog, message: store.message, isSavedCopy: store.isSavedCopy)
                }
                .padding()
                .frame(maxWidth: 1100)
                .frame(maxWidth: .infinity)
            }
            .background(Color(red: 0.063, green: 0.071, blue: 0.086))
            .navigationTitle("Voltura Projects")
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Projects, languages, topics")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Sort projects", selection: $sort) {
                            ForEach(ProjectSort.allCases) { Text($0.title).tag($0) }
                        }
                    } label: { Label("Sort projects", systemImage: "arrow.up.arrow.down") }
                    .accessibilityLabel("Sort projects: \(sort.title)")
                    .accessibilityIdentifier("sortMenu")
                }
            }
            .refreshable { await store.refresh() }
            .task(id: scenePhase) {
                if scenePhase == .active { await store.pollWhileActive() }
            }
        }
    }

    private var introduction: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Small tools. Real possibilities.").font(.title2.bold())
            Text("Apps, experiments, and everyday utilities by Joakim Skoglund.")
                .foregroundStyle(.secondary)
            Link(destination: URL(string: "https://github.com/voltura")!) {
                Label("@voltura · Original public repositories", systemImage: "arrow.up.right.square")
                    .font(.subheadline).padding(.vertical, 8)
            }
        }
    }

    @ViewBuilder private var emptyState: some View {
        if store.catalog == nil && store.isLoading {
            ProgressView("Loading projects…").frame(maxWidth: .infinity, minHeight: 200)
        } else if !query.isEmpty {
            ContentUnavailableView {
                Label("No projects found", systemImage: "magnifyingglass")
            } description: {
                Text("Try another name, language, or topic.")
            } actions: {
                Button("Reset search") { query = ""; sort = .updated }
                    .buttonStyle(.borderedProminent)
            }
        } else {
            ContentUnavailableView {
                Label("No projects available", systemImage: "square.grid.2x2")
            } description: {
                Text(store.message ?? "No original public repositories are currently listed.")
            } actions: {
                Button("Try again") { Task { await store.refresh() } }.buttonStyle(.bordered)
            }
        }
    }
}

struct RefreshFooter: View {
    let catalog: Catalog?
    let message: String?
    let isSavedCopy: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let date = catalog.flatMap({ ISODate.parse($0.refreshedAt) }) {
                Text("Updated from GitHub · \(date.formatted(date: .abbreviated, time: .shortened))")
            }
            if let message { Text(message).foregroundStyle(.orange) }
            if catalog?.refreshing == true && !isSavedCopy && catalog?.status != "delayed" {
                Label("Checking for updates…", systemImage: "arrow.triangle.2.circlepath")
            } else if let next = catalog?.nextRefresh {
                Text("Next refresh after \(next.formatted(date: .abbreviated, time: .shortened)) · starts while the app or site is open")
            }
            Text("Times shown in your local time zone. Pull to fetch the latest saved catalog.")
            Link("Visit Voltura Projects on the web", destination: URL(string: "https://voltura-projects-drab.vercel.app/")!)
                .padding(.vertical, 8)
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical)
    }
}

#Preview { GalleryView().preferredColorScheme(.dark) }
