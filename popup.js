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

          const extensionElementId = "mydiv";

          // let body = document.querySelector("body");
          // let xpe = new XPathEvaluator();
          // let nsResolver = xpe.createNSResolver(document.documentElement);
          // let result = xpe.evaluate(expressionValue, body, nsResolver, 0, null);
          // let found = [];
          // let res = null;
          // while (res = result.iterateNext())
          //   found.push(res);
          //
          // console.dir("result = " + found);
          // console.dir("found = " + found);
          //
          // if(found.length > 0) {
          //   found.forEach(e => {
          //     console.log(e.innerHTML);
          //     e.style.backgroundColor = "yellow";
          //   })
          // }

          // haha
          let html = `
            <div id="${extensionElementId}">
              <!-- Include a header DIV with the same name as the draggable DIV, followed by "header" -->
              <div id="${extensionElementId}header">Click here to move</div>
              <p>Move</p>
              <p>this</p>
              <p>DIV</p>
            </div>
           `

          console.log(html);

          let css = `
          <style>
            #${extensionElementId} {
              position: absolute;
              z-index: 9;
              background-color: #f1f1f1;
              border: 1px solid #d3d3d3;
              text-align: center;
            }
    
            #${extensionElementId}header {
              padding: 10px;
              cursor: move;
              z-index: 10;
              background-color: #2196F3;
              color: #fff;
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


          let lastPositionFromTop = document.documentElement.scrollTop;
          document.addEventListener('scroll', e => {
            let diff = calculateScrollDiff(lastPositionFromTop);
            lastPositionFromTop = document.documentElement.scrollTop;

            const elementToMove = document.querySelector("#" + extensionElementId);

            console.log("Element before: " + elementToMove.style.top);

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

            console.log("Element after: " + elementToMove.style.top);
            elementToMove.style.zIndex = Infinity;
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