# Photo comparison examples

The homepage's `PhotoComparisons` section contains three real-photo / AI-cartoon
pairs. These are illustrative style studies, not customer testimonials or a
claim that a particular image-generation provider produced the examples.

## Assets and sources

Final web assets live in `public/imgs/comparisons/` and are served locally.
JPEG encoding preserves the generated compositions while keeping page assets
smaller. The section uses lazy loading and requires no external image host.

| Pair           | Original photo                                                                                                                                                                 | Cartoon asset                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Purple glasses | Screenshot supplied by the user, saved as `purple-glasses-photo.jpg`. The image includes the original screenshot controls.                                                     | `purple-glasses-cartoon.jpg` |
| Yellow beanie  | [Dmitrii Eremin on Pexels](https://www.pexels.com/photo/man-in-warm-clothing-15741454/), downloaded 2026-11-14 as `yellow-beanie-photo.jpg`.                                   | `yellow-beanie-cartoon.jpg`  |
| Orange shirt   | [Alejandro Quiñonez on Pexels](https://www.pexels.com/photo/portrait-of-woman-in-eyeglasses-and-with-curly-hair-17110433/), downloaded 2026-11-14 as `orange-shirt-photo.jpg`. | `orange-shirt-cartoon.jpg`   |

The two stock photographs are provided under the [Pexels license](https://www.pexels.com/license/).
They illustrate a visual transformation; the people pictured are not presented
as customers or endorsers of southparkmaker.

## Generation method and prompts

All three cartoon images were generated with the built-in `image_gen` tool in
style-transfer mode, using the corresponding original photograph as the edit
target. Outputs have opaque backgrounds and a vertical 4:5 composition. No
production account credits or customer image-generation records were used.

Shared direction: transform the same person into an original South Park-inspired
flat 2D paper-cut portrait; preserve hairstyle, skin tone, clothing colors,
accessories, expression and pose. Use a rounded head, oversized white oval eyes,
small pupils, a simple mouth, compact proportions and crisp layered paper
shapes. Simplify the original scenery. Show only the cartoon image, without
text, UI, split views, checkerboards or watermarks.

- **Purple glasses:** use only the photograph on the left of the supplied
  screenshot. Preserve brown curls, purple sunglasses, lilac and lime floral
  camisole, layered necklaces, shoulder strap and relaxed head tilt. Simplify
  the neighborhood, cars, evergreen trees and blue sky into cutout scenery.
  Ignore the screenshot's label, border, divider and checkerboard.
- **Yellow beanie:** preserve the mustard beanie, gray hoodie, black jacket,
  yellow backpack straps, light stubble, serious expression and three-quarter
  pose. Use the pale-blue backdrop; omit the out-of-focus foreground hand and
  excessive empty sky. Frame the chest-up portrait around the face and hat.
- **Orange shirt:** preserve long dark curls, thin dark glasses, orange
  button-up over a black top, necklace, hand lifted beside the hair and calm
  smile. Simplify the beige stone street backdrop; leave room around the hair.

## Display

Each comparison displays two labeled images side by side. Both images fit
inside equal frames and keep their original aspect ratio.

Product strings and image descriptions live only in `messages/en.json` under
`maker.comparisons.*`.
