import Foundation
import PDFKit
import AppKit
let args = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: args[1]))!
let out = args[2]
if args.count == 3 { print("pages:", doc.pageCount); exit(0) }
let from = Int(args[3])!, to = Int(args[4])!
for i in from...to where i <= doc.pageCount {
  let page = doc.page(at: i-1)!
  let b = page.bounds(for: .mediaBox)
  let scale = 1100.0 / max(b.width, b.height)
  let size = NSSize(width: b.width*scale, height: b.height*scale)
  let img = page.thumbnail(of: size, for: .mediaBox)
  let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(out)/p\(i).png"))
}
