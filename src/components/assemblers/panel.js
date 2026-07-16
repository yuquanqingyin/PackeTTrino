/**
 * Returns an HTML element representing the **Items Panel**, where the user can pick and drag items from.
 * Panel items are rendered as `<article>` elements with the class `item`. Each item is also 
 * rendered with event listeners. The list of panel items is defined in the `panelItems` array.
 * The `panelItems` array contains objects with the following properties:
 * - `name`: The name of the item.
 * - `image`: The path to the image file for the item.
 * - `draggable`: Whether the item is draggable or not.
 * - `tooltip`: The tooltip text for the item.
 * @returns {HTMLElement}
 */
async function itemPanel() {

    const $panel = document.createElement("section");
    const $itemsContainer = document.createElement("div");
    $panel.id = "item-panel";
    $panel.classList.add("hidden");
    $panel.innerHTML = `<input type="file" id="fileInput" accept=".ptt" style="display: none;">`;
    $itemsContainer.classList.add("item-panel-elements");
    $itemsContainer.appendChild(dynamicRoutingButton());
    $panel.appendChild($itemsContainer);

    const panelItems = [
        {
            "name": "upload",
            "image": "./assets/panel/upload.svg",
            "draggable": false,
            "tooltip": "上传网络文件"
        },
        {
            "name": "load",
            "image": "./assets/panel/load.svg",
            "draggable": false,
            "tooltip": "载入已上传的文件"
        },
        {
            "name": "download",
            "image": "./assets/panel/download.svg",
            "draggable": false,
            "tooltip": "下载网络文件"
        },
        {
            "name": "pc",
            "image": "./assets/panel/pc.svg",
            "draggable": true,
            "tooltip": "PC"
        },
        {
            "name": "router",
            "image": "./assets/panel/router.svg",
            "draggable": true,
            "tooltip": "路由器"
        },
        {
            "name": "switch",
            "image": "./assets/panel/switch.svg",
            "draggable": true,
            "tooltip": "交换机"
        },
        {
            "name": "dhcpserver",
            "image": "./assets/panel/dhcpserver.svg",
            "draggable": true,
            "tooltip": "DHCP 服务器"
        },
        {
            "name": "dhcprelay",
            "image": "./assets/panel/dhcprelay.svg",
            "draggable": true,
            "tooltip": "DHCP 中继代理"
        },
        {
            "name": "dnsserver",
            "image": "./assets/panel/dnsserver.svg",
            "draggable": true,
            "tooltip": "DNS 服务器"
        },
        {
            "name": "isc-dhcp-server",
            "image": "./assets/panel/isc-dhcp-server.svg",
            "draggable": true,
            "tooltip": "isc-dhcp-server"
        },
        {
            "name": "isc-dhcp-client",
            "image": "./assets/panel/isc-dhcp-client.svg",
            "draggable": true,
            "tooltip": "isc-dhcp-client"
        },
        {
            "name": "isc-dhcp-relay",
            "image": "./assets/panel/isc-dhcp-relay.svg",
            "draggable": true,
            "tooltip": "isc-dhcp-relay"
        },
        {
            "name": "bind9",
            "image": "./assets/panel/bind9.svg",
            "draggable": true,
            "tooltip": "bind9"
        },
        {
            "name": "apache2",
            "image": "./assets/panel/apache2.svg",
            "draggable": true,
            "tooltip": "apache2"
        },
        {
            "name": "text",
            "image": "./assets/panel/annotation.svg",
            "draggable": true,
            "tooltip": "文本注释"
        },
        {
            "name": "traffic",
            "image": "./assets/panel/traffic.svg",
            "draggable": false,
            "tooltip": "网络流量"
        },
        {
            "name": "ping",
            "image": "./assets/panel/bus.svg",
            "draggable": false,
            "tooltip": "Ping 模拟器"
        },
        {
            "name": "animation-controls",
            "image": "./assets/panel/animationControls.svg",
            "draggable": false,
            "tooltip": "动画控制"
        },
        {
            "name": "settings",
            "image": "./assets/panel/settings.svg",
            "draggable": false,
            "tooltip": "通用设置"
        },
        {
            "name": "hide-panel",
            "image": "./assets/panel/hide-panel.svg",
            "draggable": false,
            "tooltip": "收起工具栏"
        }
    ]


    //add the items to the panel
    panelItems.forEach(panelItem => {
        const $itemElement = document.createElement("article");
        $itemElement.classList.add("item", "hidden", panelItem.name);
        $itemElement.draggable = panelItem.draggable;
        $itemElement.ondragstart = dragStart;
        $itemElement.innerHTML = `
            <img src="${panelItem.image}" 
            alt="${panelItem.name}"
            draggable="${panelItem.draggable}"/>`;

        $itemElement.setAttribute("onmouseenter", `showTooltip("${panelItem.tooltip}", event)`);
        $itemElement.setAttribute("onmouseleave", `deleteTooltip(event)`);
        $itemsContainer.appendChild($itemElement);
    });

    //add eventlisteners
    $panel.querySelector("#fileInput").addEventListener("change", fileInputChangeHandler);
    $panel.querySelector(".ping").addEventListener("click", quickPingStart);
    $panel.querySelector(".dynrouting").addEventListener("click", () => bodyComponent.render(DynamicRoutingMenu()));
    $panel.querySelector(".settings").addEventListener("click", generalOptionsHandler);
    $panel.querySelector(".traffic").addEventListener("click", showPacketTraffic);
    $panel.querySelector(".upload").addEventListener("click", () => $panel.querySelector("#fileInput").click());
    $panel.querySelector(".load").addEventListener("click", fileInputLoadHandler);
    $panel.querySelector(".download").addEventListener("click", downloadState);
    $panel.querySelector(".animation-controls").addEventListener("click", function () { document.querySelector(".video-controls").classList.toggle("hidden"); });
    $panel.querySelector(".hide-panel").addEventListener("click", hidePanel);

    return $panel;

}

/**
 * Manages the hide-panel button logic.
 * @returns {void}
 */
function hidePanel() {

    const $panel = $("#item-panel");
    const $hideButton = $('.hide-panel', $panel);
    const $panelItems = $$('.item', $panel);
    const isActive = $hideButton.classList.contains("active");

    $panelItems.forEach($item => {
        if (!$item.classList.contains("hide-panel")) $item.style.display = !isActive ? "none" : "flex";
    });

    if (!isActive) {
        $hideButton.classList.add("active");
    } else {
        $hideButton.classList.remove("active");
    }

}
