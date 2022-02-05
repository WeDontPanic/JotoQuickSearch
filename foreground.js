// Settings
const j_key = "j", j_useShift = false, j_useCtrl = false, j_useAlt = true;
const j_copyNodeTypes = [Node.ELEMENT_NODE, Node.TEXT_NODE];

// Keep track of pressed / released keys
var keys = [];

// Check for keys being lifted up
window.addEventListener('keyup',
    function(e){
        keys[e.key] = false;
    },
false);

// Check for keys being pressed down
window.addEventListener('keydown',
    function(e){
        keys[e.key] = true;
		
		// Check if settings are fulfilled
		if (keys[j_key]
			&& (!j_useShift || j_useShift && keys["Shift"])
				&& (!j_useCtrl || j_useCtrl && keys["Control"])
					&& (!j_useAlt || j_useAlt && keys["Alt"])) {
						
			// Copy the text and search for it on Jotoba
			let selection = getHighlightedText();
			if (selection.length > 0) {
				let url = "https://jotoba.de/search/"+selection;
				window.open(url, '_blank').focus();
			}			
			keys = [];
		}
    },
false);

// Copies the currently highlighted text respecting shadowRoot elements
function getHighlightedText() {
	// Get the current selection
    var range = window.getSelection().getRangeAt(0);
    var ancestor = range.commonAncestorContainer;
    
	// Selection only affects a single element
    if (ancestor.childNodes.length == 0) {
        var endTxt = "";
        
		// If the selection ends with an element instead of text
		if (range.endContainer.textContent.length == range.endOffset) {
			endTxt = testShadowRootAndGetContent(range.endContainer.nextSibling, true);
		}
		
		// Return the text
        return ancestor.textContent.substr(0, range.endOffset).substr(range.startOffset) + endTxt;
    }
    
	// Selection affects multiple elements
    return getContentBetweenElements(ancestor.childNodes, range.startContainer, range.endContainer, range.startOffset, range.endOffset).replace(/\s\s+/g, ' ');    
}

// Copies the entire text between two elements respecting shadowRoot and offsets
function getContentBetweenElements(nodeList, startElement, endElement, startOffset, endOffset) {
    var text = "";
    
	// Iterate the list with "some" so it can be interrupted
    Array.from(nodeList).some((e, i) => {

		// Ignore Nodes like comments and stuff
        if (!j_copyNodeTypes.includes(e.nodeType)) {
            return;
        }

		// Check where the current element is positioned
        let startCompare = startElement.compareDocumentPosition(e);
        let endCompare = endElement.compareDocumentPosition(e);
	   
		// startElement contains children
		if (startElement.nodeType == Node.ELEMENT_NODE) {
			text += testShadowRootAndGetContent(startElement.childNodes[startOffset], true);
			return true;
		}
		
		// endElement contains children
		if (endElement.textContent.length == endOffset) {
			text += testShadowRootAndGetContent(endElement.nextSibling, true);
		}
		
		// startElement is a text node: Iterate until the end respecting the elements relative position
        if (startCompare == 0) {
            text += e.textContent.substr(startOffset);
        }
        else if (endCompare == 0) {
            text += e.textContent.substr(0, endOffset);
        }
        else if (startCompare == 0b0100 && endCompare == 0b0010) {
			text += testShadowRootAndGetContent(e, false);
        }
        else if (startCompare == 0b1010 || endCompare == 0b1010) {
            text += getContentBetweenElements(e.childNodes, startElement, endElement, startOffset, endOffset);
        }
        
    });
    return text;
}

// Copies the whole content of an element
function getContent(nodeList) {
    let text = "";
    
    nodeList.forEach((e, i) => {
        text += e.textContent
    });

    return text;
}

// Copies the whole content of an element respecting shadowRoot
function testShadowRootAndGetContent(e, hasChildren) {
	let text = "";
	
	if (e.textContent.length == 0 && e.shadowRoot != undefined) 
		text += getContent(e.shadowRoot.childNodes);
	if (hasChildren)
		text += getContent(e.childNodes);
	else
		text += e.textContent;
	
	return text ;
}