/*
 * Dollmaker NEO - snap configuration
 * Add future clothing/accessory rules here. The first matching rule is used.
 * Coordinates are measured inside the original 249 x 400 doll canvas.
 */
window.DOLLMAKER_CONFIG = Object.freeze({
  canvas: Object.freeze({ width: 249, height: 400 }),
  avatar: Object.freeze({ x: 74, y: 35, width: 100, height: 100 }),
  snapRules: Object.freeze([
    Object.freeze({ name: "Long hair", match: /\/1Hair\//i, x: 91, y: 48 }),
    Object.freeze({ name: "Bra", match: /\/2Tops\/Bra\s/i, x: 108, y: 124 }),
    Object.freeze({ name: "T-shirt", match: /\/2Tops\/T-Shirt\s/i, x: 101, y: 124 }),
    Object.freeze({ name: "Panties", match: /\/3Bottoms\/Panties\s/i, x: 105, y: 165 }),
    Object.freeze({ name: "Skirt", match: /\/3Bottoms\/Skirt\s/i, x: 103, y: 160 }),
    Object.freeze({ name: "Dress", match: /\/4Full-body\/Dress\s/i, x: 100, y: 122 }),
    Object.freeze({ name: "Shoes", match: /\/5Footwear\/Shoes\s/i, x: 107, y: 329 })
  ]),
  fallback: Object.freeze({ mode: "center" })
});
