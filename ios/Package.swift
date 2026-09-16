// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VolturaCatalogCore",
    platforms: [.macOS(.v13), .iOS(.v17)],
    products: [.library(name: "CatalogCore", targets: ["CatalogCore"])],
    targets: [
        .target(name: "CatalogCore", path: "VolturaProjects",
                exclude: ["CatalogStore.swift", "GalleryView.swift", "ProjectCard.swift", "VolturaProjectsApp.swift", "Resources", "Assets.xcassets"],
                sources: ["Catalog.swift"]),
        .testTarget(name: "CatalogCoreTests", dependencies: ["CatalogCore"], path: "Tests")
    ]
)
