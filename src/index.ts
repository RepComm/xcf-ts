
import { Drawing, EXPONENT_CSS_BODY_STYLES, EXPONENT_CSS_STYLES, Panel, Text } from "@repcomm/exponent-ts";
import { XCFReader } from "./xcf.js";


EXPONENT_CSS_STYLES.mount(document.head);
EXPONENT_CSS_BODY_STYLES.mount(document.head);

async function main () {
  
  const container = new Panel()
  .setId("container")
  .mount(document.body);

  const drawing = new Drawing()
  .setId("drawing")
  .addRenderPass((ctx)=>{

  })
  .mount(container)
  .setHandlesResize(true);

  let fps = 15;
  setInterval(()=>{
    drawing.setNeedsRedraw(true);
  }, 1000/fps);

  let xcfr = new XCFReader();
  xcfr.read("./textures/drill.xcf").then((result)=>{
    
    console.log(result);

  });

}

main();
