/**
 * Inserts or updates a direct (connected) routing rule in a network object's routing table.
 *
 * A direct rule represents a locally connected network reachable through the given interface,
 * identified by a next-hop of "0.0.0.0". If a row for the interface already exists it is updated
 * in place; otherwise a new row is inserted before the default route (or appended).
 *
 * @param {string} networkObjectId - The DOM element ID of the network object whose routing table is modified.
 * @param {string} gateway - The IP address assigned to the interface (used to derive the network address).
 * @param {string} netmask - The subnet mask of the directly connected network.
 * @param {string} iface - The interface name the network is reachable through.
 * @returns {void}
 */
function setDirectRoutingRule(networkObjectId, gateway, netmask, iface) {

    if (!netmask || !gateway || !iface) return;

    const $networkObject = document.getElementById(networkObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $rules = $routingTable.querySelectorAll("tr");
    let found = false;

    $rules.forEach($rule => {

        const $fields = $rule.querySelectorAll("td");

        if ($fields.length === 0) return;

        if ($fields[3].innerHTML === iface && $fields[4].innerHTML === "0.0.0.0") {
            $fields[0].innerHTML = getNetwork(gateway, netmask);
            $fields[1].innerHTML = netmask;
            $fields[2].innerHTML = gateway;
            found = true;
        }

    });

    if (!found) {

        const $defaultRule = $routingTable.querySelector(".default-route");

        const $newRow = document.createElement("tr");

        $newRow.classList.add("direct-route");

        $newRow.innerHTML = `
            <td>${getNetwork(gateway, netmask)}</td>
            <td>${netmask}</td>
            <td>${gateway}</td>
            <td>${iface}</td>
            <td>0.0.0.0</td>
        `;

        if ($defaultRule) $defaultRule.before($newRow)
        else $routingTable.appendChild($newRow);

    }

    decorateRoutingTableActions(networkObjectId);

}

/**
 * Inserts or updates a remote (static or dynamic) routing rule in a router's routing table.
 *
 * Rows are keyed by destination network and netmask. A destination of "0.0.0.0" with a netmask
 * of "0.0.0.0" is classified as the default route. When `gateway` is "0.0.0.0" the interface's
 * own IP address is used as the gateway value.
 *
 * @param {string} routerObjectId - The DOM element ID of the router whose routing table is modified.
 * @param {string} destination - Destination network address.
 * @param {string} netmask - Subnet mask for the destination network.
 * @param {string} gateway - Next-hop IP address, or "0.0.0.0" to use the interface IP.
 * @param {string} iface - Egress interface name.
 * @param {string} nexthop - Next-hop IP address stored in the Next Hop column.
 * @returns {void}
 */
function setRemoteRoutingRule(routerObjectId, destination, netmask, gateway, iface, nexthop) {

    if (!destination || !netmask || !gateway || !iface || !nexthop) return;

    const $networkObject = document.getElementById(routerObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $routingRules = $routingTable.querySelectorAll("tr");
    let found = false;

    $routingRules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        if ($fields.length === 0) return;
        if ($fields[0].innerHTML === destination && $fields[1].innerHTML === netmask) {
            found = true;
            $fields[2].innerHTML = (gateway === "0.0.0.0") ? getIfaceData(routerObjectId, iface)[0] : gateway;
            $fields[3].innerHTML = iface;
            $fields[4].innerHTML = nexthop;
        }
    });

    if (!found) {

        const $defaultRule = $routingTable.querySelector(".default-route");

        const $newRow = document.createElement("tr");

        const ruleType = (destination === "0.0.0.0" && netmask === "0.0.0.0") ? "default-route" : "remote-route";

        $newRow.classList.add(ruleType);

        $newRow.innerHTML = `
            <td>${destination}</td>
            <td>${netmask}</td>
            <td>${(gateway === "0.0.0.0") ? getIfaceData(routerObjectId, iface)[0] : gateway}</td>
            <td>${iface}</td>
            <td>${nexthop}</td>
        `;

        if ($defaultRule) $defaultRule.before($newRow)
        else $routingTable.appendChild($newRow);

    }

    decorateRoutingTableActions(routerObjectId);

}

/**
 * Removes the direct (connected) routing rule associated with a specific interface
 * from a network object's routing table.
 *
 * Deletes any row whose interface column matches `iface` and whose next-hop is "0.0.0.0".
 *
 * @param {string} routerObjectId - The DOM element ID of the network object whose routing table is modified.
 * @param {string} iface - The interface name whose direct route should be removed.
 * @returns {void}
 */
function removeDirectRoutingRule(routerObjectId, iface) {
    const $networkObject = document.getElementById(routerObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $rules = $routingTable.querySelectorAll("tr");
    $rules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        if ($fields.length === 0) return;
        if ($fields[3].innerHTML === iface && $fields[4].innerHTML === "0.0.0.0") $rule.remove();
    });
}

/**
 * Removes a remote (static or dynamic) routing rule from a router's routing table
 * identified by its destination network and subnet mask.
 *
 * Only removes rows whose next-hop is not "0.0.0.0" (i.e. does not touch direct routes).
 *
 * @param {string} routerObjectId - The DOM element ID of the router whose routing table is modified.
 * @param {string} destination - Destination network address of the rule to remove.
 * @param {string} netmask - Subnet mask of the rule to remove.
 * @returns {void}
 */
function removeRemoteRoutingRule(routerObjectId, destination, netmask) {
    const $networkObject = document.getElementById(routerObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $rules = $routingTable.querySelectorAll("tr");
    $rules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        if ($fields.length === 0) return;
        if ($fields[4].innerHTML === "0.0.0.0") return;
        if ($fields[0].innerHTML === destination && $fields[1].innerHTML === netmask) $rule.remove();
    });
}

/**
 * Adds an operation column to a routing table. Remote and default routes receive
 * a one-click delete button, while directly connected routes are marked as
 * protected because they are generated from interface addressing.
 *
 * @param {string} networkObjectId - DOM id of the device that owns the route table.
 * @param {HTMLTableElement|null} [table=null] - Optional mirrored table, such as the router menu table.
 * @returns {void}
 */
function decorateRoutingTableActions(networkObjectId, table = null) {
    const $networkObject = document.getElementById(networkObjectId);
    if (!$networkObject) return;

    const $routingTable = table || $networkObject.querySelector(".routing-table table");
    if (!$routingTable) return;

    const $rows = $routingTable.querySelectorAll("tr");
    if ($rows.length === 0) return;

    const $headerRow = $rows[0];
    if (!$headerRow.querySelector(".route-actions-header")) {
        const $header = document.createElement("th");
        $header.classList.add("route-actions-header");
        $header.innerText = "操作";
        $headerRow.appendChild($header);
    }

    for (let i = 1; i < $rows.length; i++) {
        const $row = $rows[i];
        const $fields = Array.from($row.querySelectorAll("td:not(.route-action-cell)"));
        if ($fields.length < 5) continue;

        const destination = $fields[0].innerText.trim();
        const netmask = $fields[1].innerText.trim();
        const nextHop = $fields[4].innerText.trim();
        let $actionCell = $row.querySelector(".route-action-cell");

        if (!$actionCell) {
            $actionCell = document.createElement("td");
            $actionCell.classList.add("route-action-cell");
            $row.appendChild($actionCell);
        }

        $actionCell.replaceChildren();

        if (!destination || !netmask || !nextHop) {
            $actionCell.innerText = "—";
            continue;
        }

        if (nextHop === "0.0.0.0") {
            const $label = document.createElement("span");
            $label.classList.add("route-direct-label");
            $label.innerText = "直连";
            $label.title = "直连路由由接口 IP 自动生成，不能单独删除";
            $actionCell.appendChild($label);
            continue;
        }

        const $deleteButton = document.createElement("button");
        $deleteButton.type = "button";
        $deleteButton.classList.add("route-delete-button");
        $deleteButton.innerText = "删除";
        $deleteButton.setAttribute("aria-label", `删除路由 ${destination}/${netmaskToCidr(netmask)}`);
        $deleteButton.dataset.networkObjectId = networkObjectId;
        $deleteButton.dataset.destination = destination;
        $deleteButton.dataset.netmask = netmask;
        $deleteButton.addEventListener("click", deleteRoutingRuleButtonHandler);
        $actionCell.appendChild($deleteButton);
    }
}

/**
 * Deletes the remote/default route represented by a row-level delete button and
 * refreshes both the device table and the router configuration menu mirror.
 *
 * @param {MouseEvent} event - Click event from a `.route-delete-button`.
 * @returns {void}
 */
function deleteRoutingRuleButtonHandler(event) {
    event.stopPropagation();
    event.preventDefault();

    const $button = event.currentTarget;
    const networkObjectId = $button.dataset.networkObjectId;
    const destination = $button.dataset.destination;
    const netmask = $button.dataset.netmask;

    removeRemoteRoutingRule(networkObjectId, destination, netmask);
    decorateRoutingTableActions(networkObjectId);

    const $menu = document.querySelector(".router-form");
    if ($menu && $menu.dataset.id === networkObjectId) {
        const $networkObject = document.getElementById(networkObjectId);
        const $menuTable = $menu.querySelector("#routing-rules-table");
        $menuTable.innerHTML = $networkObject.querySelector(".routing-table table").innerHTML;
        decorateRoutingTableActions(networkObjectId, $menuTable);
    }

    bodyComponent.render(popupMessage("路由规则已删除。"));
}

/**
 * Prints the routing table of a network object to its terminal, mimicking `ip route show`.
 *
 * Outputs the default route first, then remote routes, then directly connected routes.
 * Each remote route is printed in CIDR notation with its next-hop and interface.
 * Each direct route is printed with its interface, protocol, scope, and source address.
 *
 * @param {string} networkObjectId - The DOM element ID of the network object whose routes are printed.
 * @returns {void}
 */
function printRouting(networkObjectId) {

    const $networkObject = document.getElementById(networkObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $directRoutingRules = $routingTable.querySelectorAll(".direct-route");
    const $remoteRoutingRules = $routingTable.querySelectorAll(".remote-route");
    const $defaultRoutingRule = $routingTable.querySelector(".default-route");

    if ($defaultRoutingRule) {
        const $defaultfields = $defaultRoutingRule.querySelectorAll("td");
        const defaultInterface = $defaultfields[3].innerHTML;
        const nextHop = $defaultfields[4].innerHTML;
        terminalMessage(`default via ${nextHop} dev ${defaultInterface}`, networkObjectId);
    };

    $remoteRoutingRules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        const destination = $fields[0].innerHTML;
        const netmask = $fields[1].innerHTML;
        const iface = $fields[3].innerHTML;
        const nextHop = $fields[4].innerHTML;
        terminalMessage(`${destination}/${netmaskToCidr(netmask)} via ${nextHop} dev ${iface}`, networkObjectId);
    });

    $directRoutingRules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        const destination = $fields[0].innerHTML;
        const netmask = $fields[1].innerHTML;
        const gateway = $fields[2].innerHTML;
        const iface = $fields[3].innerHTML;
        terminalMessage(`${destination}/${netmaskToCidr(netmask)} dev ${iface} proto kernel scope link src ${gateway}`, networkObjectId);
    });

}

/**
 * Resets a router's routing table to its initial empty HTML structure with three blank rows
 * and one default-route placeholder row.
 *
 * @deprecated Use targeted rule removal functions instead of resetting the entire table.
 * @param {string} routerObjectid - The DOM element ID of the router whose routing table is reset.
 * @returns {void}
 */
function routingTableRestore(routerObjectid) {

    const $routerObject = document.getElementById(routerObjectid);
    const routingTable = $routerObject.querySelector(".routing-table").querySelector("table");

    routingTable.innerHTML = `
                <tr>
                    <th>目标网络</th>
                    <th>子网掩码</th>
                    <th>网关</th>
                    <th>接口</th>
                    <th>下一跳</th>
                    <th class="route-actions-header">操作</th>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td> 0.0.0.0</td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td> 0.0.0.0 </td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td> 0.0.0.0 </td>
                </tr>
                <tr>
                    <td> 0.0.0.0 </td>
                    <td> 0.0.0.0 </td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>`;

}

/**
 * Removes all remote routing rules (`.remote-route` rows) from a router's routing table.
 *
 * @param {string} $routerObjectId - The DOM element ID of the router whose remote routes are cleared.
 * @returns {void}
 */
function removeRemoteRules($routerObjectId) {
    const $networkObject = document.getElementById($routerObjectId);
    const $remoteRoutingRules = $networkObject.querySelectorAll(".remote-route");
    $remoteRoutingRules.forEach($rule => $rule.remove());
}

/**
 * Returns the table row element for a routing rule identified by destination network and netmask.
 *
 * Skips the header row and returns the first matching `<tr>`, or false when not found.
 *
 * @param {string} routerObjectId - The DOM element ID of the router whose routing table is searched.
 * @param {string} destination - Destination network address to match.
 * @param {string} netmask - Subnet mask to match.
 * @returns {HTMLTableRowElement|false} The matching table row, or false if not found.
 */
function getRoutingRule(routerObjectId, destination, netmask) {
    const $networkObject = document.getElementById(routerObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $rows = $routingTable.querySelectorAll("tr");
    let response = false;

    for (let i = 1; i < $rows.length; i++) {
        const $row = $rows[i];
        const cells = $row.querySelectorAll("td");
        if (cells.length > 0 && cells[0].innerHTML === destination && cells[1].innerHTML === netmask) response = $row;
    }

    return response;
}

/**
 * Returns all remote routing rules for a specific interface as an array of `ip route add` command strings.
 *
 * Reads from row index 4 onward (skipping header, direct-route, and default-route rows).
 * Only includes rows whose next-hop is not "0.0.0.0" and whose interface matches `targetinterface`.
 *
 * @param {string} routerObjectid - The DOM element ID of the router whose routing rules are read.
 * @param {string} targetinterface - The interface name to filter rules by.
 * @returns {Array<string>} An array of `ip route add <dest>/<cidr> via <nexthop>` strings.
 */
function getRoutingRules(routerObjectid, targetinterface) {

    const $routerObject = document.getElementById(routerObjectid);
    const $routingTable = $routerObject.querySelector(".routing-table").querySelector("table");
    const $rows = $routingTable.querySelectorAll("tr");
    const rules = [];

    for (let i = 4; i < $rows.length; i++) {
        const $row = $rows[i];
        const $cells = $row.querySelectorAll("td");
        const destination = $cells[0].innerHTML.trim();
        const netmask = $cells[1].innerHTML.trim();
        const iface = $cells[3].innerHTML.trim();
        const nextHop = $cells[4].innerHTML.trim();
        if (iface === targetinterface && nextHop !== "0.0.0.0") rules.push(`ip route add ${destination}/${netmaskToCidr(netmask)} via ${nextHop}`);
    }

    return rules;
}

/**
 * Removes all routing rules (both direct and remote) associated with a specific interface
 * from a network object's routing table.
 *
 * Deletes any row whose interface column matches `iface`, regardless of next-hop value.
 *
 * @param {string} networkObjectId - The DOM element ID of the network object whose routing table is modified.
 * @param {string} iface - The interface name whose rules should be removed.
 * @returns {void}
 */
function removeInterfaceRoutingRules(networkObjectId, iface) {

    const $networkObject = document.getElementById(networkObjectId);
    const $routingTable = $networkObject.querySelector(".routing-table").querySelector("table");
    const $routingRules = $routingTable.querySelectorAll("tr");

    $routingRules.forEach($rule => {
        const $fields = $rule.querySelectorAll("td");
        if ($fields.length === 0) return;
        if ($fields[3].innerHTML === iface) $rule.remove();
    });

}
