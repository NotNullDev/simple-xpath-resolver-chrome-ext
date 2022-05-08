// https://developer.mozilla.org/en-US/docs/Web/XPath/Snippets
let currentTab = null;

async function init() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
}

init()

document.querySelector("#start-button")
  .addEventListener('click', async e => {
    // extension modal code:

    let expressionInput = document.querySelector("#expression-value");
    // let expressionValue = expressionInput.value;
    let expressionValue = "not used";

    chrome.storage.sync.set({"expressionValue": expressionValue}, () => {
      console.log("saved");
    });

    chrome.storage.sync.get(['expressionValue'], val => {
      console.log("get: " + val.expressionValue);
    });

    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => {
        chrome.storage.sync.get(['expressionValue'], expressionValue => {
          expressionValue = expressionValue.expressionValue;
          console.log('Expression to evaluate: ' + expressionValue);

          // test site https://www.w3schools.com/jsref/prop_range_value.asp
            // //*[text()[contains(.,'Try it Yourself »')]]
          const extensionElementId = "mydiv";
          const highlightColor = "yellow";
          const highlightOpacity = "80%";

          // haha
          let html = `
            <div id="${extensionElementId}">
              <!-- Include a header DIV with the same name as the draggable DIV, followed by "header" -->
              <div id="${extensionElementId}header">
              <div>Drag me!</div>
              </div>
                <label for="xpath-opacity-range">Opacity</label>
                <input id="xpath-opacity-range" type="range" value="100" min="10" max="100">
                <input id="xpath-expression-input"  placeholder="XPath expression">
                <button id="xpath-evaluate-button">Evaluate</button>
                
                <div>
                    Found elements: <span id="xpath-found-elements">0</span>
                </div>      
                <div>
                    Current selected: <span id="xpath-current-selected">1</span>
                </div>
                
                <div style="display: flex;">
                  <button id="xpath-previous-button">Previous</button>
                  <button id="xpath-next-button">Next</button>
                </div>
                <div>
                    <div>Error:</div>
                    <div id="xpath-error-message"></div>
                </div>
            </div>
           `
          let css = `
          <style>
            #${extensionElementId} {
              position: absolute;
              z-index: 999;
              width: 300px;
              height: 300px;
              background-color: darkgray;
            }
    
            #${extensionElementId}header {
              padding: 10px;
              z-index: 998;
              cursor: move;
              background-color: #1a45ff;
              color: darkgray;
            }
          </style>
          `

          let extElement = document.createElement("div");
          extElement.id = "extension"

          extElement.innerHTML = `
            ${html}
            ${css}
          `

          document.querySelector("body")
              .appendChild(extElement);

          initListenersForExtension();

          function initListenersForExtension() {
            // opacity handler
            {
              let opacityInputElement = document.querySelector("#xpath-opacity-range");
              opacityInputElement
                  .addEventListener("change", (e) => {

                    let newOpacity = document.querySelector("#xpath-opacity-range").value;

                    document.querySelector(`#${extensionElementId}`)
                        .style.opacity = `${newOpacity}%`;

                  })
            }

            // evaluation and navigation
            {
                let currentSelected = 0;
                let resultsArray = [];
                let firstQuery = true;

                document.querySelector("#xpath-evaluate-button")
                    .addEventListener("click", e => {
                        const inputEl = document.querySelector("#xpath-expression-input");
                        let xPathExpression = inputEl.value;

                        let foundCountEl = document.querySelector("#xpath-found-elements");

                        let errorEl = document.querySelector("#xpath-error-message");

                         try {
                          resultsArray = resolveXPath(xPathExpression);
                          foundCountEl
                              .innerHTML = resultsArray.length.toString();
                          errorEl.innerHTML = "";
                         } catch (err) {
                             console.log("err msg: " + err);
                             errorEl
                                 .innerHTML = err;
                             foundCountEl.innerHTML = "0";
                         }
                         firstQuery = true;
                         currentSelected = 0;
                    });

                document.querySelector("#xpath-next-button")
                    .addEventListener("click", e => {
                      if (firstQuery) {
                        firstQuery = false;
                      } else if (currentSelected < resultsArray.length - 1) {
                        ++currentSelected;
                      } else if (currentSelected === resultsArray.length - 1) {
                        currentSelected = 0;
                      }
                      setNewCurrentSelected(currentSelected);
                      const currentEl = resultsArray[currentSelected];
                      console.log(currentEl);
                      console.log(currentEl.getBoundingClientRect());
                      // do not call getBoundingClientRect when something is moving, else it can return 0!
                      createRectangle(
                          `${currentEl.getBoundingClientRect().width}px`,
                          `${currentEl.getBoundingClientRect().height}px`,
                          `${currentEl.getBoundingClientRect().x}px`,
                          `${currentEl.getBoundingClientRect().y}px`,
                          highlightColor,
                          highlightOpacity
                      );
                      currentEl.scrollIntoView(false);
                    });

              document.querySelector("#xpath-previous-button")
                  .addEventListener("click", e => {
                    if(firstQuery) {
                      firstQuery = false;
                    } else if (currentSelected > 0) {
                      --currentSelected;
                    } else if (currentSelected === 0) {
                      currentSelected = resultsArray.length - 1;
                    }
                    setNewCurrentSelected(currentSelected);
                    const currentEl = resultsArray[currentSelected];
                    console.log(currentEl);
                    console.log(currentEl.getBoundingClientRect());
                    createRectangle(
                        `${currentEl.getBoundingClientRect().width}px`,
                        `${currentEl.getBoundingClientRect().height}px`,
                        `${currentEl.getBoundingClientRect().x}px`,
                        `${currentEl.getBoundingClientRect().y}px`,
                        highlightColor,
                        highlightOpacity
                    );
                    currentEl.scrollIntoView(false);
                  });
            }


          }

          function createRectangle(width, height, x, y, color, opacity) {
              const rectangleEl = document.createElement("div");
              rectangleEl.style.backgroundColor = color;
              rectangleEl.style.opacity = `${opacity}`;

              rectangleEl.style.width  = width;
              rectangleEl.style.height = height;

              rectangleEl.id = width + height + x + y + color + opacity + Math.random() * 100 + (new Date().toISOString());

              console.log(`creating rectangle with: width ${width} height ${height} x ${x} y ${y} color ${color} opacity ${opacity}` );
              console.log(rectangleEl);

              rectangleEl.style.position = "absolute";
              rectangleEl.style.top  = y;
              rectangleEl.style.left = x;
              rectangleEl.style.zIndex = "2147483647";

              document.querySelector("body")
                  .appendChild(rectangleEl);

              return rectangleEl.id;
          }

          function setNewCurrentSelected(newValue) {
            document.querySelector("#xpath-current-selected")
                .innerHTML = newValue;
          }

          // code to move extModal
          dragElement(document.getElementById(extensionElementId));

          function dragElement(elmnt) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            if (document.getElementById(elmnt.id + "header")) {
              // if present, the header is where you move the DIV from:
              document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
            } else {
              // otherwise, move the DIV from anywhere inside the DIV:
              elmnt.onmousedown = dragMouseDown;
            }

            function dragMouseDown(e) {
              e = e || window.event;
              e.preventDefault();
              // get the mouse cursor position at startup:
              pos3 = e.clientX;
              pos4 = e.clientY;
              document.onmouseup = closeDragElement;
              // call a function whenever the cursor moves:
              document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
              e = e || window.event;
              e.preventDefault();
              // calculate the new cursor position:
              pos1 = pos3 - e.clientX;
              pos2 = pos4 - e.clientY;
              pos3 = e.clientX;
              pos4 = e.clientY;
              // set the element's new position:
              elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
              elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
              // stop moving when mouse button is released:
              document.onmouseup = null;
              document.onmousemove = null;
            }
          }

          function resolveXPath(xPathExpression) {
              let body = document.querySelector("body");
              let xpe = new XPathEvaluator();
              let nsResolver = xpe.createNSResolver(document.documentElement);
              let result = xpe.evaluate(xPathExpression, body, nsResolver, 0, null);
              let found = [];
              let res = null;
              while (res = result.iterateNext())
                found.push(res);
            return found;
          }

          let lastPositionFromTop = document.documentElement.scrollTop;
          document.addEventListener('scroll', e => {
            let diff = calculateScrollDiff(lastPositionFromTop);
            lastPositionFromTop = document.documentElement.scrollTop;

            const elementToMove = document.querySelector("#" + extensionElementId);

            // initial position
            if(!elementToMove.style.top) {

              const initTop = `${window.screen.availHeight / 2 - elementToMove.clientHeight}px`;
              const initLeft = `${window.screen.availWidth / 2 - elementToMove.clientWidth}px`;

              console.log(`init:\n top: ${initTop} left: ${initLeft}`);

              // elementToMove.style.top = "100px";
              // elementToMove.style.left = "100px";
              elementToMove.style.top = initTop;
              elementToMove.style.left = initLeft;
              return;
            }

            let currentPxFromTop = Number( document.querySelector("#mydiv").style.top.split("px")[0] )

            currentPxFromTop += diff;
            elementToMove.style.top = `${currentPxFromTop}px`;

            elementToMove.style.zIndex = "2147483647";
          });

          // to set up initial extension element position
          document.dispatchEvent(new Event('scroll'));

          function calculateScrollDiff(lastScrollTopValue) {
            return document.documentElement.scrollTop - lastScrollTopValue;
          }


          console.log("Extension started successfully");
        }); // chrome scrip function callback
      },
    });

  })


function evaluateXPath(aNode, aExpr) {
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
      aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}

function evaluateXPathGlobal(aExpr) {
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(document.ownerDocument == null ?
      document.documentElement : document.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, document, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}