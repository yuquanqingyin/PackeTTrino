/**
 * @description Represents a single slide in a tutorial presentation, containing a title, media
 * asset URL, and HTML content text.
 */
class slide {
    /**
     * @param {string} [title=""] - Slide title displayed as an `<h1>`.
     * @param {string} [media=""] - URL of the image to display in the slide.
     * @param {string} [text=""] - HTML content string for the slide body.
     */
    constructor(title, media, text ) {
        this.title = title || "";
        this.media = media || "";
        this.content = text || "";
        this.mediaHeight = "200px";
        this.mediaBackgroundColor = "transparent";
        this.mediaShadow = "0 15px 35px rgba(0, 0, 0, 0.2)";
    }
}

/**
 * @description Manages a modal slide-show presentation. Slides are added via `addSlide`, rendered
 * into the DOM by `startPresentation`, navigated with `render`, and dismissed with `endPresentation`.
 */
class slidePresentation {

    constructor() {
        this.slides = [];
        this.currentSlide = 0;
        this.isRendered = false;
    }

    /**
     * @description Appends one or more `slide` instances to the presentation's slide list.
     * @param {...slide} slides - Slides to add.
     * @returns {void}
     */
    addSlide(...slides) {
        this.slides.push(...slides);
    }

    /**
     * @description Builds and injects the full slide-presentation HTML into the DOM, shows the
     * modal overlay, and displays the first slide.
     * @returns {void}
     */
    startPresentation() {

        const $slidePresentationHTML = document.createElement('div');

        $slidePresentationHTML.classList.add('slide-presentation');

        $slidePresentationHTML.innerHTML = `
            ${
                this.slides.map((slide, index) => {

                    const slideStyle = `
                        height: ${slide.mediaHeight};
                        background-color: ${slide.mediaBackgroundColor};
                        box-shadow: ${slide.mediaShadow};
                    `;

                    return `<div class="slide" id="slide-${index}">
                        <h1 class="slide__title">${slide.title}</h1>
                        <div class="main-content">
                            <img class="slide__media" src="${slide.media}" style="${slideStyle}" alt="media">
                            <p class="slide__content">${slide.content}</p>
                        </div>
                    </div>`;

                }).join('')
            }

            <div class="page-selector">
                ${
                    this.slides.map((slide, index) => {
                        return `<button class="page-selector__btn" onclick="tutorial.render(${index});">${index + 1}</button>`;
                    }).join('')
                }
                <img class="next-slide-btn" src="./assets/tutorial/next.svg" alt="next" onclick="tutorial.render(tutorial.currentSlide + 1);">
                <button class="end-presentation btn-modern-blue" onclick="tutorial.endPresentation();">完成</button>
            </div>
            <div class="links">
                <a href="https://github.com/EvilPrime98/PackeTTrino" target="_blank">
                    <img src="./assets/github.svg" alt="github">
                </a>
                <a href="https://www.linkedin.com/in/josé-amín-pérez-alconchel-2191b430b" target="_blank">
                    <img src="./assets/linkedin.svg" alt="linkedin">
                </a>
            </div>
        `;

        $slidePresentationHTML.querySelectorAll('.slide').forEach( $slide => $slide.classList.add('hidden') );
        $slidePresentationHTML.querySelectorAll('.slide')[0].classList.remove('hidden');
        $slidePresentationHTML.querySelectorAll('.page-selector__btn')[0].classList.add('active');
        document.querySelector(".modal-overlay").style.display = "block";
        bodyComponent.render($slidePresentationHTML);

        this.isRendered = true;
    }

    /**
     * @description Transitions to the given slide number with a short hide animation. Does nothing
     * if the presentation is not rendered, the slide number equals the current slide, or the slide
     * index is out of range.
     * @param {number} slideNumber - Zero-based index of the slide to navigate to.
     * @returns {void}
     */
    render(slideNumber) {

        if (!this.isRendered) return;
        if (this.currentSlide === slideNumber) return;
        if (slideNumber >= this.slides.length) return;

        const $currentButton = document.querySelector('.slide-presentation').querySelectorAll('.page-selector__btn')[this.currentSlide];
        const $nextButton = document.querySelector('.slide-presentation').querySelectorAll('.page-selector__btn')[slideNumber];
        const $currentSlide = document.querySelector('.slide-presentation').querySelectorAll('.slide')[this.currentSlide];
        const $nextSlide = document.querySelector('.slide-presentation').querySelectorAll('.slide')[slideNumber];

        $currentSlide.classList.add('hiding');

        setTimeout(() => {
            $currentSlide.classList.remove('hiding');
            $currentSlide.classList.add('hidden');
            $nextSlide.classList.remove('hidden');
            $currentButton.classList.remove('active');
            $nextButton.classList.add('active');
        }, 200);

        this.currentSlide = slideNumber;
    }

    /**
     * @description TODO: Clarify intent.
     * @param {Element} element - Element to highlight.
     * @returns {void}
     */
    highlight(element) {

    }

    /**
     * @description Dismisses the presentation with a hide animation, removes it from the DOM,
     * hides the modal overlay, and persists a flag in `localStorage` so the tutorial is not shown
     * again automatically.
     * @returns {void}
     */
    endPresentation() {
        document.querySelector(".slide-presentation").classList.add('hiding');
        document.querySelector(".modal-overlay").style.display = "none";
        setTimeout(() => {
            document.querySelector(".slide-presentation").remove();
        }, 200);

        localStorage.setItem("tutorial-seen", "true");
    }

}


const introductionSlide = new slide(
  '欢迎使用 PackeTTrino 🥳',
  './assets/favicon.svg',
  `PackeTTrino 是一款直观、可交互的图形化网络学习工具。
    本教程将带你创建并连接设备，完成一个网络的搭建与模拟。现在开始吧！`
);

introductionSlide.mediaShadow = "none";

const createAndConnectDevicesSlide = new slide(
  '创建并连接设备 💻',
  './assets/tutorial/slide1.gif',
  `从底部工具栏把设备拖到工作区即可创建它。
  你可以添加 PC、交换机、路由器及多种服务器，每种设备都有自己的配置菜单。
  把 PC 拖到交换机上即可建立连接；工作区会显示对应的网线。`
);

const configureDevicesSlide = new slide(
  '配置设备 ⚙️',
  './assets/tutorial/slideDeviceSettings.gif',
  `单击设备可设置 IP 地址等基本参数；右键单击设备可打开终端、状态表及其他高级选项。
  不同设备及已安装的软件包会提供不同的配置功能。`
);

const testNetworkSlide = new slide(
  '连通性测试 📡',
  './assets/tutorial/slidePing.gif',
  `设备连接并配置完成后，可在主机之间使用 <code>ping</code> 测试网络。
  如果配置正确，终端会显示成功的应答信息。`
);

const nowItsYourTurnSlide = new slide(
  '现在轮到你了！🚀',
  './assets/tutorial/lastSlide.jpg',
  `关闭教程，尝试搭建自己的网络拓扑吧！大胆探索和实验；遇到问题时，可以随时从通用设置重新打开本教程，
  也可以查看 GitHub 上的项目文档。祝你学习顺利！`
);

const creditsSlide = new slide(
  '项目致谢 👨‍💻',
  './assets/tutorial/ies.png',
  `本应用由 <br><a href="https://www.linkedin.com/in/josé-amín-pérez-alconchel-2191b430b" target="_blank">José Amín Pérez Alconchel</a> 独立开发，
  是其在 IES Mar de Cádiz 网络计算机系统管理专业的毕业设计。
  <br><br>
  如需了解更多网络协议和工具，可访问
  <a href="https://www.fpgenred.es" target="_blank">www.fpgenred.es</a>。`
);

creditsSlide.mediaShadow = "none";

const terminalSlide = new slide(
  '集成终端 🗔',
  './assets/tutorial/slideTerminal.gif',
  `集成终端用于通过命令操作设备。
  你可以使用 <code>ping</code>、<code>curl</code>、<code>ifup</code> 等命令，也可以配置 IP 地址和子网掩码。
  <code>ls</code>、<code>cat</code>、<code>nano</code> 等命令可用于操作模拟文件系统。`
);

terminalSlide.mediaHeight = "250px";

const installPackagesSlide = new slide(
  '安装软件包 📦',
  './assets/tutorial/slidePaquetes.gif',
  `你可以在集成终端中使用 <code>apt</code> 命令安装软件包，也可以直接把底部工具栏中的软件包拖到设备上。`
);

installPackagesSlide.mediaHeight = "250px";

const tutorial = new slidePresentation();

tutorial.addSlide(
    introductionSlide,
    createAndConnectDevicesSlide,
    configureDevicesSlide,
    terminalSlide,
    testNetworkSlide,
    installPackagesSlide,
    nowItsYourTurnSlide,
    creditsSlide
);

/**
 * @description Starts the tutorial slide presentation.
 * @returns {void}
 */
function startTutorial() {
    tutorial.startPresentation();
}
