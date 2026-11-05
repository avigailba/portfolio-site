import Foundation
import PDFKit
let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
var hits: [String: [Int]] = [:]
let keys = ["badge","package picker","picker","sale","yearly","monthly","%"]
var nonEmpty = 0
for i in 0..<doc.pageCount {
  let t = (doc.page(at: i)?.string ?? "").lowercased()
  if !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { nonEmpty += 1 }
  for k in keys.prefix(6) where t.contains(k) { hits[k, default: []].append(i+1) }
}
print("pages with text:", nonEmpty)
for (k,v) in hits { print(k, v.count, v.prefix(60).map(String.init).joined(separator: ",")) }
