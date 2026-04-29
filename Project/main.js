class App {

    #data;
    #state;
    #renderer;
    #router;


    constructor(rootSiteElement) {
        this.#data = new Data();
        this.#state = new State();
        this.#renderer = new Renderer(rootSiteElement, this);
        this.#router = new Router();
    }

    init() {
        // Write Methods
        this.#router.onNavigate((pathName, params) => {
            this.#renderer.renderPage(pathName, params)
        });
        this.#state.addListener("nutrientsUpdated", () => {
            this.#renderer.updateNutrients();
        });
        this.#state.addListener("ingredientsUpdated", () => {
            this.#renderer.updateIngredients();
        });
        this.#state.addListener("mealsUpdated", () => {
            this.#renderer.updateMeals();
        });
        this.#state.addListener("recordedMealsUpdated", () => {
            this.#renderer.updateRecordedMeals();
        });

        // Init methods
        this.#data.init?.();

        // -Debug-
        console.log("Ingredients:");
        this.#data.getIngredients().forEach(i => {
            console.log(i);
        });
        console.log("Nutrients:");
        this.#data.getNutrients().forEach(n => {
            console.log(n);
        });
        console.log("Meals:");
        this.#data.getMeals().forEach(m => {
            console.log(m);
        });
        console.log("Recorded Meals:");
        this.#data.getRecordedMeals().forEach(rm => {
            console.log(rm);
        });
        //localStorage.clear()
        // -Debug end-

        this.#state.init?.({
            nutrients: this.#data.getNutrients(),
            ingredients: this.#data.getIngredients(),
            meals: this.#data.getMeals(),
            recordedMeals: this.#data.getRecordedMeals(),
        });
        this.#renderer.init?.();
        this.#router.init?.();

        // Start app flow
        if (window.location.hash.length == 0) this.#router.navigate("#ingredient-creation");
    }

    navigate(page, params) {
        this.#router.navigate(page, params);
    }

    /** @returns {nutrient} */
    nutrient(data) {
        return this.#data.nutrient(data);
    }

    /** @returns {null|string} */
    validateNutrientData(data) {
        return this.#data.validateNutrientData(data);
    }

    /** @returns {null|string} */
    trySaveNutrient(data) {
        const dataErr = this.#data.validateNutrientData(data);
        if (dataErr != null) return dataErr;

        const nutrient = this.#data.nutrient(data);
        const saveErr = this.#data.trySaveNutrient(nutrient);
        if (saveErr != null) return saveErr;

        this.#state.addNutrient(nutrient);
        return null;
    }

    deleteNutrientById(id) {
        this.#data.deleteNutrientById(id);
        this.#state.removeNutrientById(id);
    }

    /** @returns {nutrient[]} */
    getNutrients() {
        return this.#state.getNutrients();
    }

    /** @returns {nutrient|null} */
    getNutrientById(id) {
        return this.#state.getNutrientById(id);
    }

    /** @returns {null|string} */
    validateIngredientAmountData(data) {
        return this.#data.validateIngredientAmountData(data);
    }

    /** @returns {string|null} */
    trySaveIngredient(data) {
        const dataErr = this.#data.validateIngredientData(data);
        if (dataErr != null) return dataErr;

        const ingredient = this.#data.ingredient(data);
        const saveErr = this.#data.trySaveIngredient(ingredient);
        if (saveErr != null) return saveErr;

        this.#state.addIngredient(ingredient);
        return null;
    }

    deleteIngredientById(id) {
        this.#data.deleteIngredientsBy("id", id);
        this.#state.removeIngredientById(id);
    }

    /** @returns {ingredient[]} */
    getIngredients() {
        return this.#state.getIngredients();
    }

    getIngredientById(id) {
        return this.#state.getIngredientById(id);
    }

    /** @returns {ingredientAmount} */
    ingredientAmount(data) {
        return this.#data.ingredientAmount(data);
    }

    trySaveMeal(data) {
        const dataErr = this.#data.validateMealData(data);
        if (dataErr != null)
            return dataErr;

        const meal = this.#data.meal(data);
        const saveErr = this.#data.trySaveMeal(meal);
        if (saveErr != null)
            return saveErr;

        this.#state.addMeal(meal);

        console.log("Meal created");
        return null;
    }

    /** @returns {meal[]} */
    getMeals() {
        return this.#state.getMeals();
    }

    /** @returns {meal} */
    getMealById(id) {
        return this.#state.getMealById(id);
    }

    /** @returns {string|null} */
    trySaveRecordedMeal(data) {
        const dataErr = this.#data.validateRecordedMealData(data);
        if (dataErr != null) return dataErr;
        
        const recordedMeal = this.#data.recordedMeal(data);
        const saveErr = this.#data.trySaveRecordedMeal(recordedMeal);
        if (saveErr != null) return saveErr;

        this.#state.addRecordedMeal(recordedMeal);

        console.log("Recorded meal created");
        return null;
    }
    /** @returns {recordedMeal[]} */
    getRecordedMeals() {
        return this.#state.getRecordedMeals();
    }
}

const app = new App(document.getElementById("site"));

(() => {
    console.log("start");
    app.init();
})();