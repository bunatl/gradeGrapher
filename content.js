let lastIdent = "";

const getStatsData = async (url) => {
    const res = await fetch(url);
    const html = await res.text();
    // find data for rending d3 stats
    const data = html.split("d3.select('#graph_1 svg')");
    let datum = data[ 1 ].split(".call(chart);");

    datum[ 0 ] = datum[ 0 ].replace(".datum(", "");
    datum[ 0 ] = datum[ 0 ].replace(")", "");
    return datum[ 0 ];
};

const fetchAndParse = async (link) => {
    //fetch data and convert them into a text
    const response = await fetch(link);
    const html = await response.text();
    //creates the parser
    const parser = new DOMParser();
    //parse the fetched text
    return parser.parseFromString(html, "text/html");
};

const repeatTryCatch = async (linkToSpecificCourseStats) => {
    try {
        return await getStatsData(linkToSpecificCourseStats);
    } catch (err) {
        // try again
        repeatTryCatch(linkToSpecificCourseStats);
    }
};

const showStats = async (ident) => {
    //create an URL to a corresponding faculty
    const facultyURL = `https://insis.vse.cz/auth/student/hodnoceni.pl?fakulta=${ ident.charAt(0) }0;;lang=cz`;

    const doc = await fetchAndParse(facultyURL);
    // number of rows in the table
    const numOfRows = await doc.getElementById("tmtab_1").rows.length;
    /* 
     * try row after row
     * each row represent one semester
     * if no record is found, next row will be tried
     * first row is table header
     */
    for (let i = 1; i < numOfRows; i++) {
        const currentRow = await doc.getElementById("tmtab_1").rows[ i ];

        const semesterName = await currentRow.firstChild.firstChild.innerText;
        const link = await currentRow.lastChild.getElementsByTagName("a")[ 0 ].href;

        const doc2 = await fetchAndParse(link);
        const numOfRows2 = await doc2.getElementById("tmtab_1").rows.length;

        for (var j = 1; j < numOfRows2; j++) {
            const currentRow2 = await doc2.getElementById("tmtab_1").rows[ j ];
            const currentIndent = await currentRow2.firstChild.firstChild.innerText;

            // course found in the list of all course for given semester
            if (currentIndent === ident) {
                const linkToSpecificCourseStats = await currentRow2.lastChild.getElementsByTagName("a")[ 0 ].href;
                const fetchedData = await repeatTryCatch(linkToSpecificCourseStats);
                if (fetchedData === '' || fetchedData === null || fetchedData === undefined) showStats(ident);
                return {
                    semesterName,
                    statsData: fetchedData
                };
            }
        }
    }
    // if course hasn't been found in any semester return
    return {
        semesterName: "",
        statsData: ""
    };
};

//return selected/highlighted text on a page (window or document)
const getSelectedText = () => {
    if (window.getSelection) return window.getSelection().toString();
    if (document.selection && document.selection.type != "Control") return document.selection.createRange().text;
    return '';
};

//listens to a mouse click and then check any selected text for given pattern
document.addEventListener("click", async () => {
    const selectedText = getSelectedText();
    //define regex expresions to be match in selected text
    //4IT444, global and upper/lower characters
    const re = new RegExp('[0-9][a-z]{2}[0-9]{3}', 'gi');
    //theses 4OBP
    const re2 = new RegExp('[0-9][a-z]{3}', 'gi');
    //minor specialization 3PO
    const re3 = new RegExp('[0-9][a-z]{2}', 'gi');

    //graph is shown is when no previous process is in progress and matched given regen expression
    if (re.test(selectedText) || re2.test(selectedText) || re3.test(selectedText)) {
        // set default extention icon
        // chrome.runtime.sendMessage({ type: 'clearIcon' });
        //removing any white spaces in selected text
        const ident = selectedText.replace(/\s/g, '');
        if (ident.length < 3) return;
        if (ident.length >= 7) return;
        if (lastIdent === ident) return;
        else lastIdent = ident;
        chrome.runtime.sendMessage({ type: 'fetching' });
        //all data in background script before processing new ident are cleared
        const { semesterName, statsData } = await showStats(ident);

        chrome.runtime.sendMessage({
            semester: semesterName === "" ? `No previous statistics for the course ${ ident } were found! Sorry.` : semesterName,
            graphData: statsData,
            courseIdent: ident
        });
    }
});
