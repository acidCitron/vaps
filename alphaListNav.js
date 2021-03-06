"use strict";

class AlphaListNav {
    constructor(listElem, options = {}) {

        const defaultOptions = {
            initHidden: false,
            initHiddenText: '',  // string or boolean false
            initLetter: '',
            includeAll: true,
            allText: 'Toutes nos marques',
            noMatchText: 'No matching entries',
            includeNums: true,
            concatenateNums: true, // 0 - 9
            includeOther: false,
            flagDisabled: true,
            removeDisabled: false,
            prefixes: [], // array of strings and/or RegEx's
            filterSelector: '',
            showCounts: false,
            showLetterHeadings: false,
        }


        this.listElem = this._isDomElement(listElem) ? listElem : document.getElementById(listElem);

        this.options = {
            ...defaultOptions,
            ...options
        }

        this.alphaObj = null;
        this.alphaNav = null;
        this.newListHTML = null;

        // if there is options.prefixes[], check if any are strings, if so, convert to them to RegEx's
        if (this.options.prefixes.length) {
            const regexes = this.options.prefixes.map(val => {
                if (typeof val === 'string') {
                    val = val.replace(/[.*+?^${}()|[\]\\]/, '\\$&');
                    return val + '\\s';//new RegExp(val);
                }
                if (typeof val === 'object' && val instanceof RegExp) {
                    return val.source + '\\s';
                }
            });
            this.options.prefixes = new RegExp(regexes.join("|"), "gi");
        }

        this.init();
    }

    init = () => {

        // if first arg is not an HTMLElement, return
        if (!this.listElem) { console.error('The supplied argument must be a HTML DOM element or a valid element id (string)'); return; }
        // get array of list items
        const listItems = this._getListItems(this.listElem);
        //console.log(listItems);
        // sort list into an alphabetical object
        this.alphaObj = this._getAlphaObj(listItems);
        //console.log(this.alphaObj);
        // generate new list html with sorting markup
        this.newListHTML = this._generateNewListHTML(this.alphaObj);
        // generate the alpha-nav buttons html
        this.alphaNav = this._generateAlphaNav(this.alphaObj);
        // Replace the old list with the new alpha-list in the dom
        this.listElem.parentNode.replaceChild(this.newListHTML, this.listElem);
        // // get reference to the new alpha-list
        //const newListElem = document.getElementById('alpha-list');
        // Add alpha-nav buttons to dom
        this.newListHTML.parentNode.insertBefore(this.alphaNav, this.newListHTML);
        // get reference to alpha-nav
        //const alphaNavElem = document.getElementById('alpha-nav');

        this.initAlphaListNav(this.newListHTML, this.alphaNav, this.alphaObj);

        // Add event listener to alpha-nav buttons
        this.alphaNav.addEventListener('click', e => {
            // TODO: replace with create selectLetter() function
            e.preventDefault();
            if (!e.target.dataset.filter) return;
            const letter = e.target.dataset.filter;
            // remove active class from all buttons
            for (let btn of this.alphaNav.children) {
                btn.classList.remove('active');
            }
            // remove active class from all lists
            for (let ul of this.newListHTML.children) {
                ul.classList.remove('active');
            }
            // add active class to button clicked
            e.target.classList.add('active');
            // add active class to the list matching the cooresponding clicked letter
            if (letter === '*') {
                for (let div of this.newListHTML.children) {
                    if (div.id !== 'no-match')
                        div.classList.add('active');
                }
            } else {
                this.newListHTML.querySelector(`#${letter.replace(/[-]/, '\\$&')}`).classList.add('active');
            }

        });

    }

    // Retrieve the text value from DOM node or an array of DOM nodes.
    // Taken from jQuery (source: https://github.com/jquery/jquery/blob/master/src/core.js)
    _getText = (elem) => {
        let node,
            ret = "",
            i = 0,
            nodeType = elem.nodeType;
        if (!nodeType) {
            // If no nodeType, this is expected to be an array
            while ((node = elem[i++])) {
                // Do not traverse comment nodes
                ret += this._getText(node);
            }
        } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
            // Use textContent for elements
            if (typeof elem.textContent === "string") {
                return elem.textContent;
            } else {
                // Traverse its children
                for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                    ret += this._getText(elem);
                }
            }
        } else if (nodeType === 3 || nodeType === 4) {
            return elem.nodeValue;
        }
        return ret;
    }

    initAlphaListNav = (newListElem, alphaNavElem, alphaObj) => {
        // if initLetter is set, show that letter first
        if (this.options.initLetter) {
            // if init letter is All(*), show all
            if (this.options.initLetter === '*' && this.options.includeAll) {
                alphaNavElem.querySelector(`a[data-filter="${this.options.initLetter.toLowerCase()}"]`).classList.add('active');
                const allListGroups = newListElem.querySelectorAll('div.alpha-list-wrapper');
                Array.prototype.slice.call(allListGroups).forEach(div => div.classList.add('active'));
                // else show init letter, if it exists..
            } else if (alphaObj.hasOwnProperty(this.options.initLetter.toLowerCase())) {
                // TODO: replace with create selectLetter() function
                alphaNavElem.querySelector(`a[data-filter="${this.options.initLetter.toLowerCase()}"]`).classList.add('active');
                newListElem.querySelector(`#${this.options.initLetter.toLowerCase()}`).classList.add('active');
            }
        } else {
            // if initHidden set, don't show list
            if (this.options.initHidden) {
                if (this.options.initHiddenText)
                    document.getElementById('initText').classList.add('active');
                // if includeAll is set, show all list
            } else if (this.options.includeAll) {
                const allListGroups = newListElem.querySelectorAll('div.alpha-list-wrapper');
                Array.prototype.slice.call(allListGroups).forEach(div => div.classList.add('active'));
                alphaNavElem.querySelector(`a[data-filter="*"]`).classList.add('active');
                // if none of above, find first letter with with list items, and show that first.
            } else {
                const firstLetter = this._getArrayAtoZ().find(char => alphaObj.hasOwnProperty(char.toLowerCase())).toLowerCase();

                // TODO: replace with/create selectLetter() function
                alphaNavElem.querySelector(`a[data-filter="${firstLetter}"]`).classList.add('active');
                document.getElementById(firstLetter).classList.add('active');
            }
        }
    }

    _getListItems(listElem) {
        if (!listElem.children.length)
            return [];
        return Array.prototype.slice.call(listElem.children);
    }

    _isDomElement(elem) {
        return (
            typeof HTMLElement === "object" ? elem instanceof HTMLElement : //DOM2
                elem && typeof elem === "object" && elem !== null && elem.nodeType === 1 && typeof elem.nodeName === "string"
        );
    }

    // create object of list items ordered by each alphabet letter
    _getAlphaObj = (listItemsArray) => {
        const alphaList = listItemsArray.reduce((accum, val) => {
            let text = '';
            if (this.options.filterSelector) {
                const filterElem = val.querySelector(this.options.filterSelector);
                text = filterElem ? this._getText(filterElem) : this._getText(val);
            } else {
                text = this._getText(val);
            }
            if (text) {
                // if text first char is (-_*) for some reason, remove it because it will cause problems.
                text.trim().replace(/^[_*-]/, '');
                let letter;
                if (this.options.prefixes instanceof RegExp) {
                    let result;
                    if ((result = this.options.prefixes.exec(text)) !== null) {
                        letter = text.charAt(this.options.prefixes.lastIndex).toLowerCase();
                    } else {
                        letter = text.charAt(0).toLowerCase();
                    }
                } else {
                    letter = text.charAt(0).toLowerCase();
                }
                if (letter.match(/[0-9A-Za-z]/)) {
                    if (this.options.concatenateNums) {
                        if (letter.match(/[0-9]/)) {
                            letter = '_';
                        }
                    }
                } else {
                    letter = '-'
                }

                if (accum[letter]) {
                    accum[letter].push(val)
                } else {
                    accum[letter] = [val];
                }
            }
            return accum;
        }, {});
        if (this.options.initHidden) {
            const initHiddenTextLi = document.createElement('li');
            initHiddenTextLi.className = 'init-hidden-text';
            initHiddenTextLi.textContent = this.options.initHiddenText
            alphaList['initText'] = [initHiddenTextLi];
        }
        return alphaList;
    }

    _getHeading(key) {
        let headingText = '';
        switch (true) {
            case /^[*]$/.test(key):
                headingText = this.options.allText;
                break;
            case /^[_]$/.test(key):
                headingText = '0 - 9';
                break;
            case /^[-]$/.test(key):
                headingText = 'Others';
                break;
            case /^initText$/.test(key):
                break;
            default:
                headingText = key.toUpperCase();
        }
        return headingText;
    }

    // generate new list HTML markup
    _generateNewListHTML = (alphaObj) => {
        const wrapper = document.createElement('div');
        wrapper.id = 'alpha-list';
        wrapper.className = 'alpha-list';
        const NewList = Object.keys(alphaObj)
            .sort((a, b) => {
                if (a === '-') return 1;
                if (b === '-') return -1;
                if (a < b)
                    return -1;
                if (a > b)
                    return 1;
                return 0;
            })
            .map((key) => {
                const div = document.createElement('div');
                div.id = key;
                div.className = 'alpha-list-wrapper';
                if (this.options.showLetterHeadings) {
                    const heading = document.createElement('h3');
                    heading.className = 'alpha-list-heading';
                    heading.textContent = this._getHeading(key)
                    if (heading.textContent)
                        div.appendChild(heading);
                }
                const ul = document.createElement('ul');
                ul.className = 'alpha-list-group';
                ul.style = 'display: grid;';

                alphaObj[key].forEach(node => {
                    ul.appendChild(node.cloneNode(true));
                });
                div.appendChild(ul);
                wrapper.appendChild(div);
                return div;
            });
        const noMatchDiv = document.createElement('div');
        noMatchDiv.id = 'no-match';
        const noMatchUl = document.createElement('ul');
        noMatchUl.className = 'no-match-group';
        const noMatchLi = document.createElement('li');
        noMatchLi.textContent = this.options.noMatchText;

        noMatchUl.appendChild(noMatchLi);
        noMatchDiv.appendChild(noMatchUl);
        wrapper.appendChild(noMatchDiv);
        return wrapper;
    }

    // Generate alphabet navigation HTML markup
    _generateAlphaNav = (alphaObj) => {
        const alphaNav = document.createElement('div');
        alphaNav.id = 'alpha-nav';
        alphaNav.className = 'character-container';
        const abcChars = this._getArrayAtoZ();
        if (this.options.includeNums) {
            if (!this.options.concatenateNums) {
                this._getArray0to9().reverse().forEach(val => abcChars.unshift(val.toString()));
            } else {
                abcChars.unshift('_');
            }
        }
        // if (this.options.includeOther)
        //     abcChars.push('-');
        // if (this.options.includeAll)
        //     abcChars.unshift('*')
        //console.log(abcChars);
        const navigationEntries = abcChars.reduce((block, navChar) => {

            if (alphaObj[navChar.toLowerCase()]) {
                if (navChar === '_') {
                    return block + '<a class="character-element" style="color: #42aedd" data-filter="' + navChar.toLowerCase() + '" href="#">0 - 9</a>';
                } else if (navChar === '-') {
                    return block + '<a class="character-element" style="color: #42aedd" data-filter="' + navChar.toLowerCase() + '" href="#">...</a>';
                } else {
                    return block + '<a class="character-element" style="color: #42aedd" data-filter="' + navChar.toLowerCase() + '" href="#">' + navChar + '</a>';
                }

            } //else if (navChar === '*') {
                //return block + '<a class="character-element" data-filter="' + navChar.toLowerCase() + '" href="#">' + this.options.allText + '</a>';
            //}
            if (this.options.flagDisabled) {
                if (this.options.removeDisabled) {
                    return block;
                }
                if (navChar === '_') {
                    return block + '<a class="character-element disabled">0 - 9</a>';
                } else if (navChar === '-') {
                    return block + '<a class="character-element disabled">...</a>';
                } else {
                    return block + '<a class="character-element disabled">' + navChar + '</a>';
                }
            }
            return block + '<a class="character-element" data-filter="no-match" href="#">' + navChar + '</a>';
        }, '');
        alphaNav.innerHTML = navigationEntries;
        return alphaNav;
    }

    // generate array of alphebet, a - z
    _getArrayAtoZ = () => {
        return Array
            .apply(null, { length: 26 })
            .map((x, i) => String.fromCharCode(65 + i));
    }

    _getArray0to9 = () => {
        return Array
            .apply(null, new Array(10))
            .map((x, i) => i);
    };

}