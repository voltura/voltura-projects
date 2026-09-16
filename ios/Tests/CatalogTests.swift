import XCTest
@testable import CatalogCore

final class CatalogTests: XCTestCase {
    private func project(_ id: Int, _ name: String, stars: Int = 0,
                         updated: String = "2026-09-16T09:00:00Z",
                         created: String = "2026-01-01T00:00:00Z") -> Project {
        Project(id: id, name: name, title: name, description: nil,
                url: "https://github.com/voltura/\(name)", language: "Swift",
                topics: ["utilities"], stars: stars, updated: updated, created: created,
                archived: true, images: [], links: [])
    }

    func testSearchMatchesEveryTermAcrossMetadata() {
        let items = [project(1, "Air"), project(2, "Clock")]
        XCTAssertEqual(ProjectSort.name.apply(to: items, query: "  AIR swift utilities ").map(\.id), [1])
        XCTAssertTrue(ProjectSort.name.apply(to: items, query: "air missing").isEmpty)
        XCTAssertEqual(ProjectSort.name.apply(to: items, query: "  ").count, 2)
    }

    func testEverySortAndAlphabeticalTies() {
        let a = project(1, "Alpha", stars: 2)
        let b = project(2, "Beta", stars: 2)
        let z = project(3, "Zeta", stars: 5, updated: "2026-09-17T00:00:00Z", created: "2026-09-01T00:00:00Z")
        XCTAssertEqual(ProjectSort.name.apply(to: [z,b,a], query: "").map(\.id), [1,2,3])
        for sort in [ProjectSort.updated, .stars, .created] {
            XCTAssertEqual(sort.apply(to: [b,z,a], query: "").map(\.id), [3,1,2])
        }
    }

    func testDatesAndSixHourRefresh() {
        let time = "2026-09-16T09:06:56.943Z"
        let catalog = Catalog(projects: [], refreshedAt: time)
        XCTAssertEqual(catalog.nextRefresh!.timeIntervalSince(ISODate.parse(time)!), 21600)
        XCTAssertNotNil(ISODate.parse("2026-09-16T09:06:56Z"))
        XCTAssertNil(ISODate.parse("not a date"))
    }

    func testUnsafeDestinationsAreRejected() {
        for url in ["javascript:alert(1)", "file:///etc/passwd", "https://user:pass@example.com", "/relative"] {
            XCTAssertNil(WebURL.parse(url))
        }
        XCTAssertNotNil(WebURL.parse("https://youtu.be/example"))
        XCTAssertNotNil(WebURL.parse("http://example.com"))
    }

    func testOptionalDescriptionAndArchivedOriginal() {
        let p = project(1, "Alpha")
        XCTAssertEqual(p.displayDescription, "Explore the source code on GitHub.")
        XCTAssertEqual(ProjectSort.updated.apply(to: [p], query: "").count, 1)
    }

    func testDecodingNullMetadataAndMultipleLinks() throws {
        let json = #"{"projects":[{"id":1,"name":"Air","title":"Voltura Air","description":null,"url":"https://github.com/voltura/voltura-air","language":null,"topics":[],"stars":0,"updated":"2026-09-16T00:00:00Z","created":"2026-09-16T00:00:00Z","archived":false,"images":[],"links":[{"kind":"YouTube","url":"https://youtube.com/@voltura-air","label":"Channel"},{"kind":"YouTube","url":"https://youtu.be/demo","label":"Demo"},{"kind":"YouTube","url":"https://youtu.be/demo","label":"Duplicate"}]}],"refreshedAt":"2026-09-16T00:00:00Z","status":"ready","refreshing":false}"#
        let catalog = try JSONDecoder().decode(Catalog.self, from: Data(json.utf8))
        XCTAssertEqual(catalog.projects[0].destinations.count, 3)
        XCTAssertEqual(catalog.projects[0].destinations.map(\.kind), ["GitHub", "YouTube", "YouTube"])
    }
}
