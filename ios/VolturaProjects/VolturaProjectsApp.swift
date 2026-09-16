import SwiftUI

@main
struct VolturaProjectsApp: App {
    var body: some Scene {
        WindowGroup {
            GalleryView()
                .preferredColorScheme(.dark)
                .tint(Color(red: 0.52, green: 0.68, blue: 1))
        }
    }
}
