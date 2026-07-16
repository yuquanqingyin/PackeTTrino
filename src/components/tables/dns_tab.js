/**
 * Creates and returns a DNS zone records table modal element as an `<article>` DOM node.
 * The table has three columns — Domain, Record Type, and Value — and a "Close"
 * button that calls `closeObjectModalTable`. Click events on the element are stopped
 * from propagating so they do not trigger parent board interactions.
 *
 * @returns {HTMLElement} The DNS table `<article>` element, ready to be appended to a network object.
 */
function dnsTable() {

    const $dnsTable = document.createElement("article");

    $dnsTable.classList.add("modal-table","dns-table");
    $dnsTable.innerHTML = `
                <table>
                    <tr>
                        <th>域名</th>
                        <th>记录类型</th>
                        <th>记录值</th>
                    </tr>
                </table>
                <button onclick="closeObjectModalTable(event, '.dns-table')">关闭</button>`;


    $dnsTable.setAttribute("onclick", "event.stopPropagation()");

    return $dnsTable;

}
