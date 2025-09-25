export class ResultDataProcessor {
    static process(scores, questions, config) {
        const categories = Array.isArray(config.categories)
            ? config.categories.reduce((acc, cat) => ({ ...acc, ...cat }), {})
            : config.categories;

        const categoryMaxScores = this.calculateMaxScores(questions, config, categories);
        const categoryData = this.enrichScoresWithMetadata(scores, categories, categoryMaxScores, config);
        
        return {
            categories,
            categoryMaxScores,
            categoryData,
            questions,
            config
        };
    }
    
    static calculateMaxScores(questions, config, categories) {
        const categoryMaxScores = {};
        Object.keys(categories).forEach(categoryKey => {
            const categoryQuestions = questions.filter(q => q.category === categoryKey);
            const maxAnswerValue = config.answers.reduce((max, ans) => Math.max(max, ans.value), 0);
            categoryMaxScores[categoryKey] = categoryQuestions.length * maxAnswerValue;
        });
        return categoryMaxScores;
    }
    
    static enrichScoresWithMetadata(scores, categories, categoryMaxScores, config) {
        return Object.entries(scores).map(([categoryKey, score]) => {
            const categoryName = categories[categoryKey] || categoryKey;
            const maxScore = categoryMaxScores[categoryKey] || 0;
            const percentage = maxScore > 0 ? parseFloat(((score / maxScore) * 100).toFixed(2)) : 0;
            
            const trafficLightConfig = Array.isArray(config.trafficlights)
                ? config.trafficlights.find(t => t.categories.split(',').map(s => s.trim()).includes(categoryKey))
                : undefined;
            
            return {
                categoryKey,
                categoryName,
                score,
                maxScore,
                percentage,
                trafficLightConfig,
                trafficLightColor: this.getTrafficLightColor(percentage, trafficLightConfig)
            };
        });
    }
    
    static getTrafficLightColor(percentage, config) {
        if (!config) return 'transparent';

        if (config.green !== undefined) {
            if (percentage <= config.green) return 'green';
            if (percentage <= config.orange) return 'orange';
            return 'red';
        } else if (config.red !== undefined) {
            if (percentage <= config.red) return 'red';
            if (percentage <= config.orange) return 'orange';
            return 'green';
        }
        return 'transparent';
    }
}