class State {

    #eventListeners = {

    };

    #nutrients = [];
    #ingredients = [];
    #meals = [];
    #recordedMeals = [];

    
    init(data) {
        this.setNutrients(data.nutrients);
        this.setIngredients(data.ingredients);
        this.setMeals(data.meals);
        this.setRecordedMeals(data.recordedMeals);
    }

    getNutrients() {
        return [...this.#nutrients];
    }
    setNutrients(list) {
        if (!Array.isArray(list)) {
            throw new Error("Argument exception: Cannot set nutrients to non-array value");
        }

        this.#nutrients = list;
        this.#dispatch("nutrientsUpdated");
    }
    addNutrient(nutrient) {
        this.#nutrients.push(nutrient);
        this.#dispatch("nutrientsUpdated");
    }
    removeNutrientById(id) {
        this.#nutrients = this.#nutrients.filter(n => n.id !== id);
        this.#dispatch("nutrientsUpdated");
    }
    getNutrientById(id) {
        return this.#nutrients.find(n => n.id === id) ?? null;
    }

    getIngredients() {
        return [...this.#ingredients];
    }
    setIngredients(list) {
        if (!Array.isArray(list)) {
            throw new Error("Argument exception: Cannot set ingredients to non-array value");
        }

        this.#ingredients = list;
        this.#dispatch("ingredientsUpdated");
    }
    addIngredient(ingredient) {
        this.#ingredients.push(ingredient);
        this.#dispatch("ingredientsUpdated");
    }
    getIngredientById(id) {
        return this.#ingredients.find(i => i.id === id) ?? null;
    }
    removeIngredientById(id) {
        this.#ingredients = this.#ingredients.filter(i => i.id !== id);
        this.#dispatch("ingredientsUpdated");
    }

    setMeals(list) {
        if (!Array.isArray(list)) {
            throw new Error("Argument exception: Cannot set meals to non-array value");
        }

        this.#meals = list;
        this.#dispatch("mealsUpdated");
    }
    getMeals() {
        return [...this.#meals];
    }
    addMeal(meal) {
        this.#meals.push(meal);
        this.#dispatch("mealsUpdated");
    }
    getMealById(id) {
        return this.#meals.find(n => n.id === id) ?? null;
    }

    setRecordedMeals(list) {
        if (!Array.isArray(list)) {
            throw new Error("Argument exception: Cannot set recordedMeals to non-array value");
        }

        this.#recordedMeals = list;
        this.#dispatch("recordedMealsUpdated");
    }
    getRecordedMeals() {
        return [...this.#recordedMeals];
    }
    addRecordedMeal(recordedMeal) {
        this.#recordedMeals.push(recordedMeal);
        this.#dispatch("recordedMealsUpdated");
    }

    addListener(event, callback) {
        const listeners = this.#eventListeners;
        if (listeners[event] == null)
            listeners[event] = [];

        listeners[event].push(callback);
    }

    removeListener(event, callback) {
        const listeners = this.#eventListeners;
        if (listeners[event] == null) return;

        listeners[event] = listeners[event].filter(c => callback !== c);
        if (listeners[event].length == 0) delete listeners[event];
    }


    #dispatch(event, data) {
        if (this.#eventListeners[event] == null) return;

        this.#eventListeners[event].forEach(callback => {
            callback?.(data);
        });
    }
};