import AppKit
import CoreGraphics
let a = CommandLine.arguments
let src = NSImage(contentsOfFile: a[1])!
var r = CGRect(origin: .zero, size: src.size)
let cg = src.cgImage(forProposedRect: &r, context: nil, hints: nil)!
let w = cg.width, h = cg.height
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
let px = ctx.data!.assumingMemoryBound(to: UInt8.self)
let bpr = ctx.bytesPerRow
// sample background at top-left coordinates (300,195)
let sx = Int(a[3])!, sy = Int(a[4])!; let o = sy * bpr + sx * 4
ctx.setFillColor(red: CGFloat(px[o])/255, green: CGFloat(px[o+1])/255, blue: CGFloat(px[o+2])/255, alpha: 1)
// CGContext origin is bottom-left
ctx.fill(CGRect(x: CGFloat(Int(a[5])!), y: CGFloat(h - Int(a[6])! - Int(a[8])!), width: CGFloat(Int(a[7])!), height: CGFloat(Int(a[8])!)))
let out = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! out.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
print(w, h)
