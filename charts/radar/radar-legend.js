/**
 * RadarLegend - Legend rendering for mobile radar charts
 */
export class RadarLegend {
    /**
     * Create legend for narrow screens or when short labels are active
     * @param {string} containerId - DOM selector for container
     * @param {Object} config - Chart configuration
     * @param {string} labelState - Current label state ('short' or 'long')
     */
    static render(containerId, config, labelState) {
        const showLegend = (window.innerWidth < 650 || labelState === 'short');

        // Only create legend if needed and valid category data exists
        if (!showLegend || !this.hasValidCategoryData(config)) {
            this.remove();
            return;
        }

        this.remove(); // Remove any existing legend
        this.createLegend(containerId, config);
    }

    /**
     * Check if configuration has valid category data
     * @param {Object} config - Chart configuration
     * @returns {boolean} True if valid category data exists
     */
    static hasValidCategoryData(config) {
        return typeof config.config === 'object' && 
               Array.isArray(config.config.categoriesArray) &&
               config.config.categoriesArray.length > 0;
    }

    /**
     * Create legend container and content
     * @param {string} containerId - DOM selector for container
     * @param {Object} config - Chart configuration
     */
    static createLegend(containerId, config) {
        const legendContainer = document.getElementById('radar-legend-container');
        if (!legendContainer) {
            console.error('createLegend: ERROR - radar-legend-container not found!');
            return;
        }

        // Create legend container
        const legendContent = this.createLegendContainer();
        
        // Create wrapper div
        const wrapperDiv = this.createWrapperDiv();
        wrapperDiv.appendChild(legendContent);

        // Insert legend into the dedicated container
        legendContainer.appendChild(wrapperDiv);

        // Add legend content
        this.addLegendContent(legendContent, config);
    }

    /**
     * Create legend container element
     * @returns {HTMLElement} Legend container
     */
    static createLegendContainer() {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'radar-legend';
        
        Object.assign(legendContainer.style, {
            marginTop: '2rem',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.95rem',
            color: '#4a5568',
            textAlign: 'left',
            padding: '0 1rem',
            width: '100%',
            clear: 'both',
            display: 'block',
            position: 'relative'
        });

        return legendContainer;
    }

    /**
     * Create wrapper div for legend
     * @returns {HTMLElement} Wrapper div
     */
    static createWrapperDiv() {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'radar-legend-wrapper'; // Add class for easier removal
        
        Object.assign(wrapperDiv.style, {
            display: 'block',
            width: '100%',
            clear: 'both'
        });

        return wrapperDiv;
    }

    /**
     * Add content to legend container
     * @param {HTMLElement} legendContainer - Legend container element
     * @param {Object} config - Chart configuration
     */
    static addLegendContent(legendContainer, config) {
        // Add title
        const legendTitle = this.createLegendTitle();
        legendContainer.appendChild(legendTitle);

        // Add categories list
        const categoriesList = this.createCategoriesList(config);
        legendContainer.appendChild(categoriesList);
    }

    /**
     * Create legend title element
     * @returns {HTMLElement} Legend title
     */
    static createLegendTitle() {
        const legendTitle = document.createElement('div');
        legendTitle.textContent = 'Legende:';
        
        Object.assign(legendTitle.style, {
            fontWeight: '600',
            marginBottom: '0.5em',
            fontSize: '1.05em'
        });

        return legendTitle;
    }

    /**
     * Create categories list
     * @param {Object} config - Chart configuration
     * @returns {HTMLElement} Categories list
     */
    static createCategoriesList(config) {
        const ul = document.createElement('ul');
        
        Object.assign(ul.style, {
            listStyle: 'disc inside',
            margin: '0',
            padding: '0'
        });

        // Use the order from categoriesArray
        config.config.categoriesArray.forEach(({key, value}) => {
            const li = this.createCategoryItem(key, value);
            ul.appendChild(li);
        });

        return ul;
    }

    /**
     * Create individual category item
     * @param {string} key - Category key
     * @param {string} value - Category value
     * @returns {HTMLElement} Category list item
     */
    static createCategoryItem(key, value) {
        const li = document.createElement('li');
        li.style.marginBottom = '0.4em';
        li.textContent = `${key}: ${value}`;
        return li;
    }

    /**
     * Remove all existing legends
     */
    static remove() {
        const legendContainer = document.getElementById('radar-legend-container');
        if (legendContainer) {
            legendContainer.innerHTML = ''; // Clear the container
        }
        const legends = document.querySelectorAll('.radar-legend-wrapper');
        legends.forEach(legend => legend.remove());
    }

    /**
     * Update legend based on window size
     * @param {string} containerId - DOM selector for container
     * @param {Object} config - Chart configuration
     */
    static update(containerId, config) {
        this.render(containerId, config);
    }

    /**
     * Create custom legend with color coding
     * @param {string} containerId - DOM selector for container
     * @param {Object} config - Chart configuration
     * @param {Array} datasets - Chart datasets for color mapping
     */
    static renderWithColors(containerId, config, datasets) {
        if (window.innerWidth >= 650 || !this.hasValidCategoryData(config)) {
            this.remove();
            return;
        }

        this.remove();
        
        const chartContainer = document.querySelector(containerId);
        if (!chartContainer) return;

        const parentContainer = chartContainer.parentNode;
        const legendContainer = this.createLegendContainer();
        const wrapperDiv = this.createWrapperDiv();
        
        wrapperDiv.appendChild(legendContainer);
        
        if (chartContainer.nextSibling) {
            parentContainer.insertBefore(wrapperDiv, chartContainer.nextSibling);
        } else {
            parentContainer.appendChild(wrapperDiv);
        }

        // Add title
        const legendTitle = this.createLegendTitle();
        legendContainer.appendChild(legendTitle);

        // Add categories with colors
        const ul = document.createElement('ul');
        Object.assign(ul.style, {
            listStyle: 'none',
            margin: '0',
            padding: '0'
        });

        config.config.categoriesArray.forEach(({key, value}, index) => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.4em';
            li.style.display = 'flex';
            li.style.alignItems = 'center';

            // Add color indicator if datasets available
            if (datasets && datasets.length > 0) {
                const colorBox = document.createElement('div');
                Object.assign(colorBox.style, {
                    width: '12px',
                    height: '12px',
                    backgroundColor: config.color(0), // Use first dataset color
                    marginRight: '8px',
                    borderRadius: '2px'
                });
                li.appendChild(colorBox);
            }

            const textSpan = document.createElement('span');
            textSpan.textContent = `${key}: ${value}`;
            li.appendChild(textSpan);

            ul.appendChild(li);
        });

        legendContainer.appendChild(ul);
    }
}
