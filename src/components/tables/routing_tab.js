/**
 * Creates and returns a routing table modal element as an `<article>` DOM node.
 * The table has five columns — Destination Network, Netmask, Exit, Interface,
 * and Next Hop — and a "Close" button that calls `closeObjectModalTable`.
 * Click events on the element are stopped from propagating so they do not trigger
 * parent board interactions.
 *
 * @returns {HTMLElement} The routing table `<article>` element, ready to be appended to a network object.
 */
function routingTable() {
    const $routingTable = document.createElement("article");

    $routingTable.classList.add("modal-table","routing-table");

    $routingTable.innerHTML = `
        <table>
            <tr>
                <th>目标网络</th>
                <th>子网掩码</th>
                <th>出口地址</th>
                <th>接口</th>
                <th>下一跳</th>
                <th class="route-actions-header">操作</th>
            </tr>
        </table>
        <button onclick="closeObjectModalTable(event, '.routing-table')">关闭</button>
    `;

    $routingTable.setAttribute("onclick", "event.stopPropagation()");

    return $routingTable;
}
