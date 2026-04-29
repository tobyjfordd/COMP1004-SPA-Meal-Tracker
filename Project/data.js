//#region docs
/**
 * @typedef {Object} recordedMeal
 * @property {string} mealId
 * @property {string} id
 * @property {Date} date
 */
/**
 * @typedef {Object} meal
 * @property {string} name
 * @property {ingredientAmount[]} ingredientAmounts
 * @property {nutrientAmount[]} nutrientAmounts
 * @property {string} id
 */
/**
 * @typedef {Object} nutrient
 * @property {string} name
 * @property {string} unit
 * @property {string} id
 */
/**
 * @typedef {Object} ingredient
 * @property {string} name
 * @property {string} grams
 * @property {string} id
 * @property {nutrientAmount[]} nutrientAmounts
 */
/**
 * @typedef {Object} nutrientAmount
 * @property {string} nutrientId
 * @property {number} amount
 */
/**
 * @typedef {Object} ingredientAmount
 * @property {string} ingredientId
 * @property {number} amount
 */
//#endregion

class Data {

    #ingredientsKey = "ingredients";
    #nutrientsKey = "nutrients";
    #mealsKey = "meals";
    #recordedMealsKey = "recordedMeals";

    /**
     * Checks if the given data could be used to create a valid nutrient object
     * @param {unknown} data
     * @returns null if valid, otherwise returns a string detailing the error.
     */
    validateNutrientData(data) {
        if (data == null) return "data is null";
        const {name, unit} = data;
        if (!name) return "Name required";
        if (!unit) return "Unit required";
        return null;
    }

    /**
     * Creates a nutrient object from inputted data, generating any optional values if they're not provided and removing any unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.name - Name of the nutrient, e.g. protein
     * @param {string} data.unit - Unit of the nutrient, e.g. grams
     * 
     * @returns {nutrient} A nutrient object
     * 
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    nutrient(data) {
        if (this.validateNutrientData(data) != null) {
            throw new Error("Invalid nutrient parameters");
        }

        const {name, unit} = data;
        return {
            name: name,
            unit: unit,
            id: name+'_'+unit
        };
    }

    /**
     * Tries to save an object to local storage as a nutrient.
     * @param {unknown} data - Input data
     * @returns {null|string} null if successful, otherwise a string detailing the error
     */
    trySaveNutrient(data) {
        const err = this.validateNutrientData(data);
        if (err != null) return err;

        const nutrient = this.nutrient(data);

        if (this.getNutrientById(nutrient.id) != null)
            return "Nutrient already exists";
        else {
            const nutrients = this.getNutrients();
            nutrients.push(nutrient);
            this.#set(this.#nutrientsKey, nutrients);
            console.log(`nutrient saved:
                name: ${nutrient.name}
                unit: ${nutrient.unit}
                id: ${nutrient.id}`
            );
            return null;
        }
    }

    /**
     * Delete all nutrients with given id from local storage
     * @param {string} id 
     */
    deleteNutrientById(id) {
        try {
            const nutrient = this.getNutrientById(id);
            if (!nutrient) throw new Error("nutrient with given id not found");
            const nutrients = this.getNutrients().filter(n => n.id != id);
            this.#set(this.#nutrientsKey, nutrients);
        }
        catch (e) {
            console.error(e);
        }
    }

    /**
     * Get all nutrients from local storage
     * @returns {Array<nutrient>} Array of nutrients
     */
    getNutrients() {
        return this.#get(this.#nutrientsKey) ?? [];
    }
    /**
     * Get nutrient with given id from local storage
     * @param {string} id 
     * @returns {nutrient|null} nutrient, or null if not found
     */
    getNutrientById(id) {
        return (this.#get(this.#nutrientsKey) ?? []).find(n => n.id === id) ?? null;
    }

    /**
     * Creates an ingredient object from inputted data, generating any optional values if they're not provided and removing any unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.name - Name of ingredient
     * @param {number} data.grams - No. of grams the nutrient amounts are relevant to
     * @param {Array<nutrientAmount>} data.nutrientAmounts - List of nutrient amounts
     * 
     * @returns {ingredient} An ingredient object
     * 
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    ingredient(data) {
        const err = this.validateIngredientData(data);
        if (err != null)
            throw new Error(err);

        let {id, name, grams, nutrientAmounts} = data;
        return {
            id: id ? id : crypto.randomUUID(),
            name: name,
            grams: grams,
            nutrientAmounts: nutrientAmounts
        }
    }

    /**
     * Checks if the given data could be used to create a valid ingredient object
     * @param {unknown} data
     * @returns null if valid, otherwise returns a string detailing the error.
     */
    validateIngredientData(data) {
        if (data == null) return "data is null";
        const {name, grams, nutrientAmounts} = data;
        if (typeof name !== "string")
            return "name must be a string";
        if (!name.trim())
            return "name required";
        if (grams == null) return "grams required";
        if (!Number.isFinite(grams)) return "grams must be a number";
        if (nutrientAmounts == null) return "nutrientAmounts required";
        if (!Array.isArray(nutrientAmounts)) return "nutrientAmounts must be an array";

        let nutrientAmountErrors = "";
        nutrientAmounts.forEach((na, index) => {
            const err = this.validateNutrientAmountData(na);
            if (err != null)
                nutrientAmountErrors += `(${index}) ${err}\n`;
        });
        if (nutrientAmountErrors !== "")
            return "nutrientAmounts:\n" + nutrientAmountErrors;

        return null;
    }

    /**
     * Tries to save an object to local storage as an ingredient. Will overwrite any existing ingredient based on id.
     * Cannot save if an ingredient with the same name already exists.
     * @param {unknown} data - Input data
     * @returns {null|string} null if successful, otherwise a string detailing the error
     */
    trySaveIngredient(data) {
        try {
            const err = this.validateIngredientData(data);
            if (err !== null) return err;
            const newIngredient = this.ingredient(data);

            const ingredients = this.getIngredients();

            let index = -1;
            let nameAlreadyExists = false;
            ingredients.forEach((existing, i) => {
                if (existing.id === newIngredient.id) index = i;
                else if (existing.name === newIngredient.name) nameAlreadyExists = true;
            });

            if (nameAlreadyExists) return "Ingredient name already exists";

            if (index !== -1) {
                console.log(`Overwriting ingredient (id: ${newIngredient.id})`);
                ingredients[index] = newIngredient;
            }
            else {
                console.log("Pushing new ingredient");
                ingredients.push(newIngredient);
            }

            this.#set(this.#ingredientsKey, ingredients);
            return null;
        }
        catch (e) {
            return String(e);
        }
    }

    /**
     * Deletes all ingredients whose attribute matches the value of the one provided.
     * @param {string} attributeName - The name of the attribute targeted
     * @param {any} attributeValue - The value to match the attribute against
     */
    deleteIngredientsBy(attributeName, attributeValue) {
        const modified = this.getIngredients().filter(
            ingredient => ingredient[attributeName] !== attributeValue
        );
        this.#set(this.#ingredientsKey, modified);
    }

    /**
     * Gets an array of all ingredient objects from local storage
     * @returns {Array<ingredient>} Array of ingredients
     */
    getIngredients() {
        return this.#get(this.#ingredientsKey) ?? [];
    }

    /**
     * Checks if the given data could be used to create a valid nutrientAmount object
     * @param {unknown} data
     * @returns null if valid, otherwise returns a string detailing the error.
     */
    validateNutrientAmountData(data) {
        if (data == null) return "data is null";
        const {nutrientId, amount} = data;

        if (nutrientId == null) return "nutrientId required";
        if (typeof nutrientId !== "string") return "nutrientId must be a string";
        if (!nutrientId.trim()) return "nutrientId can't be empty";
        if (amount == null) return "amount required";
        if (!Number.isFinite(amount)) return "amount must be a number";
        if (amount < 0) return "amount can't be negative";

        return null;
    }

    // data: {nutrient <nutrient>, amount <number>}
    /**
     * Creates a nutrientAmount object from inputted data, generating any optional values if they're not provided and removing any unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.nutrientId - Id of the nutrient
     * @param {number} data.amount- Amount of the nutrient
     * 
     * @returns {nutrientAmount} A nutrientAmount object
     * 
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    nutrientAmount(data) {
        const err = this.validateNutrientAmountData(data);
        if (err != null) throw new Error(err);

        const {nutrientId, amount} = data;
        return {
            nutrientId,
            amount
        };
    }

    /**
     * Checks if the given data could be used to create a valid ingredientAmount object
     * @param {unknown} data 
     * @returns {null|string} null if valid, otherwise a string detailing error.
     */
    validateIngredientAmountData(data) {
        if (data == null) return "data is null";
        const {ingredientId, amount} = data;
        if (ingredientId == null) return "ingredientId required";
        if (typeof ingredientId != "string") return "ingredientId must be a string";
        if (!ingredientId.trim()) return "ingredientId can't be empty";
        const ingredient = this.getByAttribute(this.#ingredientsKey, "id", ingredientId)?.[0];
        if (ingredient == null) return "ingredient not found";
        if (!Number.isFinite(amount)) return "amount must be a number";
        if (amount < 0) return "amount can't be negative";
        return null;
    }

    /**
     * Creates an ingredientAmount object from inputted data, generating any optional values if they're not provided and removing any unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.ingredientId - Id of the ingredient
     * @param {number} data.amount - Amount of the ingredient
     * 
     * @returns {ingredientAmount} An ingredientAmount object
     * 
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    ingredientAmount(data) {
        const err = this.validateIngredientAmountData(data);
        if (err != null) throw new Error(err);

        const {ingredientId, amount} = data;
        return {
            ingredientId,
            amount
        };
    }

    /**
     * Checks if given data could be used to create a valid meal object
     * @param {unknown} data 
     * @returns null if data could be parsed into a valid meal object,
     * otherwise returns a string detailing the error.
     */
    validateMealData(data) {
        if (data == null) return "data is null";
        const {name, ingredientAmounts, nutrientAmounts} = data;
        const err = (() => {
            if (name == null) return "name required"
            if (typeof name !== "string") return "name must be a string";
            if (!name.trim()) return "name can't be empty";
            if (ingredientAmounts != null && !Array.isArray(ingredientAmounts)) return "ingredientAmounts must be an array or null";
            if (nutrientAmounts != null && !Array.isArray(nutrientAmounts)) return "nutrientAmounts must be an array or null";
            return null;
        })();
        return err;
    }

    /**
     * Creates a meal object from inputted data, generating any optional values if they're not provided and removing unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.name - Meal name
     * @param {string} [data.id] - Meal id
     * @param {Array<ingredientAmount>} [data.ingredientAmounts] - Ingredient amounts
     * @param {Array<nutrientAmount>} [data.nutrientAmounts] - Additional nutrient amounts
     * @returns {meal} A meal object
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    meal(data) {
        const err = this.validateMealData(data);
        if (err != null) throw new Error(err);

        const {name, ingredientAmounts, nutrientAmounts, id} = data;

        return {
            id: id ? id : crypto.randomUUID(),
            name: name,
            ingredientAmounts: ingredientAmounts ?? [],
            nutrientAmounts: nutrientAmounts ?? []
        }
    }

    /**
     * Gets all meals from local storage
     * @returns {meal[]} Array of meals
     */
    getMeals() {
        return this.#get(this.#mealsKey) ?? [];
    }

    /**
     * Tries to save an object to local storage as a meal. Will overwrite any existing ingredient based on id.
     * Cannot save if a meal with the same name already exists.
     * @param {unknown} data - Input data
     * @returns {null|string} null if successful, otherwise a string detailing the error
     */
    trySaveMeal(data) {
        const dataErr = this.validateMealData(data);
        if (dataErr != null) return dataErr;

        const meal = this.meal(data);
        const meals = this.getMeals();
        if (meals.some(m => m.name === meal.name))
            return "meal name already exists";

        const index = meals.findIndex(m => m.id === meal.id);
        if (index !== -1)
            meals[index] = meal;
        else
            meals.push(meal);

        this.#set(this.#mealsKey, meals);

        return null;
    }

    /**
     * Checks if the given data could be used to create a valid recordedMeal object
     * @param {unknown} data
     * @returns null if valid, otherwise returns a string detailing the error.
     */
    validateRecordedMealData(data) {
        if (data == null) return "data is null";
        const {mealId, date, id} = data;
        const err = (() => {
            if (mealId == null) return "mealId required";
            else if (typeof mealId !== "string") return "mealId must be a string";
            else if (!mealId.trim()) return "mealId can't be empty";
            if (date != null) {
                {
                    if (date instanceof Date) {
                        if (Number.isNaN(date.getTime()))
                            return "Date is invalid";
                    }
                    else if (typeof date === "string") {
                        if (Number.isNaN(new Date(date).getTime()))
                            return "date-string is invalid";
                    }
                    else
                        return "date must be of type <Date> or <string>";
                }
            }
            if (id != null && typeof id !== "string")
                return "provided id must be a string";
            return null;
        })();
        return err;
    }

    /**
     * Creates a recordedMeal object from inputted data, generating any optional values if they're not provided and removing any unnecessary values.
     * @param {Object} data - Input data
     * @param {string} data.mealId - Id of the meal being recorded
     * @param {string} [data.id] - Id of the recordedMeal being created
     * @param {string} [data.date] - Date of the recordedMeal being created
     * 
     * @returns {recordedMeal} A recordedMeal object
     * 
     * @throws {Error} If object creation fails (e.g. required attributes missing)
     */
    recordedMeal(data) {
        const err = this.validateRecordedMealData(data);
        if (err != null) throw new Error(err);

        const {mealId, id, date} = data;

        return {
            id: id ?? crypto.randomUUID(),
            mealId: mealId,
            date: date != null ? new Date(date) : new Date()
        }
    }

    /**
     * Tries to save an object to local storage as a recordedMeal.
     * @param {unknown} data - Input data
     * @returns {null|string} null if successful, otherwise a string detailing the error
     */
    trySaveRecordedMeal(data) {
        const err = this.validateRecordedMealData(data);
        if (err != null) return err;
        
        const recordedMeal = this.recordedMeal(data);
        const recordedMeals = this.getRecordedMeals();
        const index = recordedMeals.findIndex(i => i.id === recordedMeal.id);
        if (index === -1) {
            console.log("Pushing new recorded meal");
            recordedMeals.push(recordedMeal);
        }
        else {
            console.log(`Overwriting recorded meal with id: ${recordedMeal.id}`);
            recordedMeals[index] = recordedMeal;
        }
        this.#set(this.#recordedMealsKey, recordedMeals);
        return null;
    }

    /**
     * Get all recorded meals from local storage.
     * @returns {Array<recordedMeal>} Array of recordedMeal objects
     */
    getRecordedMeals() {
        return this.#get(this.#recordedMealsKey) ?? [];
    }

    /**
     * Searches list at the given key for objects which have an attribute that matches given name and value.
     * @param {string} keyForList - The key to access the list in local storage
     * @param {string} attributeName - The name of the attribute to check
     * @param {any} attributeValue - The value to match the attribute against
     * @returns {Array<any>} Array containing all objects matching description
    */
    getByAttribute(keyForList, attributeName, attributeValue) {
        const storedList = this.#get(keyForList) ?? [];

        return storedList.filter(
            element => element != null && element[attributeName] === attributeValue
        );
    }
    
    /**
     * @param {string} key - key to search
     * @returns {any|null} The value at given key as an object. Null if not found
    */
    #get(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        }
        catch (e) {
            console.error(`Error: ${e}`);
            return null;
        }
    }
    
    /**
     * Set value at key with value as a stringified JSON
     * @param {string} key 
     * @param {any} value 
     */
    #set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        }
        catch (e) {
            console.error(`Error: ${e}`);
        }
    }
};