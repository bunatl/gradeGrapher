const insisURL = "https://insis.vse.cz/auth/student/";
let inUse = false;

async function getStatsData( url ){
    const response = await fetch( url );
    return await response.text().then( function( html ) {
        const data = html.split( "d3.select('#graph_1 svg')" );
        let datum = data[1].split( ".call(chart);" );

        datum[0] = datum[0].replace(".datum(", "");
        datum[0] = datum[0].replace(")", "");
        return datum[0];
    });
}

function parseCourseURL( str ){
    var arr = str.split( "href=" );
    var res = arr[1].split( "><" );
    res[0] = res[0].replace('"', "");
    return res[0];
}

function parseSemesterURL( text ){
    var res = text.split( "href=" );
    var res2 = res[1].split( '"' );
    return res2[1];
}

async function showStats ( ident ){
    let identFound = false;
    //create an URL to a corresponding faculty
    const facultyURL = insisURL + "hodnoceni.pl?fakulta=" + ident.charAt( 0 ) + "0;;lang=cz";
    //fetch data and convert them into a text
    const response = await fetch( facultyURL );
    const html = await response.text();
    //creates the parser
    const parser = new DOMParser();
    //parse the fetched text
    const doc = parser.parseFromString( html, "text/html" );
    //number of cols and rows in the table
    const numOfCols = doc.getElementById("tmtab_1").rows[1].cells.length;
    const numOfRows = doc.getElementById("tmtab_1").rows.length;

    /* 
     * try row after row
     * each row represent one semester
     * if no record is found, next row will be tried
     */
    for ( var i = 1; i < 5; i++ ){ //numOfRows
        const tableRow = doc.getElementById("tmtab_1").rows[i].cells[numOfCols - 1].innerHTML;
        //create a link pointing to a semester depaning on how many we have tried (for loop)
        const semesterURL = insisURL + parseSemesterURL( tableRow );
        //get semester name
        let semesterName = doc.getElementById("tmtab_1").rows[i].cells[0].innerHTML;
        //in the table it is in a small tag which has to be also strip away
        semesterName = semesterName.replace('<small>','');
        semesterName = semesterName.replace('</small>','');
        //fetch data from page with courses and parse them into a text
        const response2 = await fetch( semesterURL );
        const html2 = await response2.text();
        /*
         * parse a table on the page with courses by tag small
         * it return array of rows of the parsed table
         */
        const elementArray = html2.split( "small>" );
        //for each element(row) check if the row contains searched ident of the course
        elementArray.forEach( async function ( element, index ) {
            //if ident is present, the construct a link to course statistics
            if ( element.includes( ident ) ){
                //flag has to be set here becuase some of the following functions are async
                identFound = true;
                //function getStatsData sometimes could be slow on obtain fetch data, therefore is in a try block
                try{
                    //link is in the 8th column
                    const statsData = await getStatsData( insisURL + parseCourseURL( elementArray[ index+8 ] ) );
                    chrome.runtime.sendMessage({
                        semester: semesterName,
                        graphData: statsData,
                        courseIdent : ident
                    });
                } catch ( err ) {
                    //info log is displayed into console
                    console.info( "Error: " + err + " in getStatsData function has occured. Current function (ShowStats) is inicialized again.");
                    //since data were not obtained (errors from getStatsData) function showStats needs to be inicialized again
                    showStats(ident);
                }
            }
            //if there is no ident on the page try another semester, by increasing i by 1
        });
        if ( identFound == true )
            break;
    }
    //If the ident if nout found and every semester was searched
    if ( identFound == false )
        chrome.runtime.sendMessage({
            semester: "No previous statistics for the course " + ident + " were found! Sorry.",
            graphData: ""
        });
}

//return selected/highlighted text on a page (window or document)
function getSelectedText() {
    let text = "";
    if ( window.getSelection ) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

//listens to a mouse click and then check any selected text for given pattern
document.addEventListener("click", async function(){
    let selectedText = getSelectedText();
    //define regex expresions to be match in selected text
    //4IT444, global and upper/lower characters
    const re = new RegExp('[0-9][a-z]{2}[0-9]{3}', 'gi');
    //theses 4OBP
    const re2 = new RegExp('[0-9][a-z]{3}', 'gi');
    //minor specialization 3PO
    const re3 = new RegExp('[0-9][a-z]{2}', 'gi');

    //graph is shown is when no previous process is in progress and matched given regen expression
    if ( !inUse  && ( selectedText.length > 2 ) && ( re.test( selectedText ) || re2.test( selectedText ) || re3.test( selectedText ) ) ) {
        inUse = true; 
        //removing any white spaces
        selectedText = selectedText.replace(/\s/g, '');
        //all data in background script before processing new ident are cleared
        chrome.runtime.sendMessage({ clear: "" });
        await showStats( selectedText ).then( function() {
            inUse = false;
        });
    }
});
