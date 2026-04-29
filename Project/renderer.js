class Renderer {

    #root;
    #app;

    #internalCallbacks = {};

    #pages = {
        "": (params) => this.#createDashboardPage(params),
        "testpage": (params) => this.#createTestPage(params),
        "ingredient-creation": (params) => this.#createIngredientCreationPage(params),
        "dashboard": (params) => this.#createDashboardPage(params)
    };


    constructor(rootElement, app) {
        this.#root = rootElement;
        this.#app = app;
    }

    renderPage(pageName, params) {
        this.#root.innerHTML = "";
        this.#internalCallbacks = {};

        let renderFunc = this.#pages[pageName];
        if (renderFunc == null) {
            console.error("Error: Trying to render unregistered page");
            return;
        }
        const wrapper = this.#createNavigationWrapper();
        this.wrapContent(wrapper, renderFunc(params));
        this.#root.append(wrapper);
    }

    wrapContent(wrapper, content) {
        const contentContainer = wrapper.querySelector("#wrapper-content-container");
        contentContainer.append(content);
    }

    // Event handlers
    updateNutrients() {
        this.#internalCallbacks["nutrientsUpdated"]?.forEach(c => {
            c?.();
        });
    }

    updateIngredients() {
        this.#internalCallbacks["ingredientsUpdated"]?.forEach(c => {
            c?.();
        });
    }

    updateMeals() {
        this.#internalCallbacks["mealsUpdated"]?.forEach(c => {
            c?.();
        });
    }

    updateRecordedMeals() {
        this.#internalCallbacks["recordedMealsUpdated"]?.forEach(c => {
            c?.();
        });
    }

    #on(eventName, callback) {
        if (this.#internalCallbacks[eventName] == null)
            this.#internalCallbacks[eventName] = [];
        this.#internalCallbacks[eventName].push(callback);
    }
    #off(eventName, callback) {
        const cList = this.#internalCallbacks[eventName];
        if (cList == null) return;
        this.#internalCallbacks[eventName] = cList.filter(c => c !== callback);
    }

    // page wrapper

    #createNavigationWrapper() {
        const wrapper = document.getElementById("navigation-wrapper-template").content.cloneNode(true).firstElementChild;
        const dashboardButton = wrapper.querySelector("#open-dashboard-button");
        const ingredientsButton = wrapper.querySelector("#open-ingredients-button");

        dashboardButton.addEventListener("click", () => {
            this.#app.navigate("dashboard");
        });
        ingredientsButton.addEventListener("click", () => {
            this.#app.navigate("ingredient-creation");
        });
        return wrapper;
    }

    //#region pages

    // - Simple test page used to check if routing works.
    #createTestPage() {
        alert("creating test page");
        const content = document.createElement("div");
        content.innerHTML = `
        <h1>Test Page</h1>
        <p>Welcome to the test page.</p>
        `;

        return content;
    }

    #createIngredientCreationPage() {
        console.log("\nCreating ingredient creation page");

        // UI Creation

        const content = document.createElement("div");
        content.id ="ingredient-creation-page";

        const cardHolder = document.createElement("div");
        cardHolder.classList.add("centered-cards-holder");
        content.append(cardHolder);

        // Ingredient list view
        const ingredientListView = this.#createIngredientListSection();
        cardHolder.append(ingredientListView);

        // Ingredient creation view
        const ingredientCreationView = this.#createIngredientCreationSection();
        cardHolder.append(ingredientCreationView);

        // Nutrient creation view
        const nutrientCreationView = this.#createNutrientCreationSection();
        cardHolder.append(nutrientCreationView);

        return content;
    }

    #createDashboardPage() {
        console.log("\nCreating Dashboard Page");

        const content = document.createElement("div");
        content.id ="dashboard-page";

        const cardHolder = document.createElement("div");
        cardHolder.classList.add("centered-cards-holder");
        content.append(cardHolder);

        const mealCreationView = this.#createMealCreationSection();
        cardHolder.append(mealCreationView);

        const mealRecordingView = this.#createMealRecordingSection();
        cardHolder.append(mealRecordingView);

        return content;
    }

    //#endregion

    //#region sections

    #createMealRecordingSection() {
        const section = document.getElementById("meal-recording-section-template").content.cloneNode(true).firstElementChild;
        const mealSelector = section.querySelector("[data-role='meal']");
        const createButton = section.querySelector("[data-role='create']");
        const recordedMealList = section.querySelector("[data-role='recorded-meals']");

        /* // No-meal option
        mealSelector.append((() => {
            const option = document.createElement("option");
            option.value = null;
            option.textContent = "None";
            return option;
        })());
        */

        // Append pre-made meal options
        this.#app.getMeals().forEach(meal => {
            const option = document.createElement("option");
            option.value = meal.id;
            option.textContent = meal.name;
            mealSelector.append(option);
        });

        createButton.addEventListener("click", () => {
            const err = this.#app.trySaveRecordedMeal({
                mealId: mealSelector.value
            })
            if (err != null) console.warn(err);
        });

        const updateRecordedMealList = () => {
            recordedMealList.innerHTML = ``;
            this.#app.getRecordedMeals().forEach(rm => {
                const dItem = this.#createRecordedMealDisplayItem(rm);
                if (dItem) recordedMealList.append(dItem);
            });
        };

        this.#on("recordedMealsUpdated", updateRecordedMealList);

        updateRecordedMealList();

        return section;
    }

    #createMealCreationSection() {
        const section = document.getElementById("meal-creation-section-template").content.cloneNode(true).firstElementChild;
        const ingredientAmountListContainer = section.querySelector("[data-insert='incremental-list']");
        const createButton = section.querySelector("[data-role='create']");
        const nameInput = section.querySelector("[data-role='name']");
        const mealList = section.querySelector("[data-role='meal-list']");
        const chosenIngredientIds = new Set();

        
        const ingredientAmountList = this.#createIncrementalList(
            "Add your ingredients here.", 
            "+ Ingredient", 
            (params) => this.#createIngredientAmountCreationItem(params),
            {chosenIngredientIds}
        );
        ingredientAmountListContainer.append(ingredientAmountList.view);

        createButton.addEventListener("click", () => {
            const name = nameInput.value.trim();
            const ingredientAmounts = [];

            [...ingredientAmountList.list.children].forEach(el => {
                let data = {
                    ingredientId: el.querySelector("[data-role='ingredient']").value,
                    amount: Number(el.querySelector("[data-role='amount']").value.trim?.())
                }
                
                const err = this.#app.validateIngredientAmountData(data);
                if (err != null) {
                    console.warn(`Tried saving invalid ingredientAmount data:\n${err}\nData below:`);
                    console.warn(data);
                    return;
                }
                data = this.#app.ingredientAmount(data);
                ingredientAmounts.push(data);
            });

            let meal = {
                name,
                ingredientAmounts,
                nutrientAmounts: []
            }
            const err = this.#app.trySaveMeal(meal);
            if (err != null) console.warn(err);
        });
        

        const updateMealList = () => {
            mealList.innerHTML = ``;
            this.#app.getMeals().forEach(meal => {
                mealList.append(this.#createMealDisplayItem(meal));
            });
        }

        this.#on("mealsUpdated", () => {
            updateMealList();
        });

        updateMealList();

        return section;
    }

    #createIngredientListSection() {
        const section = document.getElementById("ingredient-list-section-template").content.cloneNode(true).firstElementChild;
        const list = section.querySelector("[data-role='ingredient-list']");

        this.#on("ingredientsUpdated", () => {
            list.innerHTML = ``;
            this.#app.getIngredients().forEach(ing => {
                const ingItem = this.#createIngredientItem(ing);
                if (ingItem) list.append(ingItem);
            });
        });

        this.updateIngredients();

        return section;
    }

    #createIngredientCreationSection() {
        const section = document.getElementById("ingredient-creation-section-template").content.cloneNode(true).firstElementChild;
        const createButton = section.querySelector("[data-role='create']");
        const nameInput = section.querySelector("[data-role='name']");
        const gramsInput = section.querySelector("[data-role='grams']");

        const chosenNutrientIds = new Set();

        const incrementalList = this.#createIncrementalList(
            "Add your nutritional info here.", 
            "+ Nutrient", 
            (params) => this.#createNutrientAmountCreationItem(params),
            {chosenNutrientIds}
        );
        
        const incrementalListContainer = section.querySelector("[data-insert='incremental-list']");
        incrementalListContainer.append(incrementalList.view);

        createButton.addEventListener("click", () => {
            const name = nameInput.value.trim();
            let grams = gramsInput.value.trim() !== "" ? Number(gramsInput.value) : 100;
            if (!Number.isFinite(grams)) grams = 100;
            const nutrientAmounts = [];
            for (const item of incrementalList.list.children) {
                const nutrientId = item.querySelector("[data-role='nutrient']").value;
                const amount = Number(item.querySelector("[data-role='amount']").value.trim());
                if (Number.isNaN(amount)) console.warn("amount is NaN");
                nutrientAmounts.push({nutrientId, amount});
            }

            console.log("Trying to save ingredient. Sending data:");
            console.log({ name, grams, nutrientAmounts});
            
            const err = this.#app.trySaveIngredient({
                name: name,
                grams: grams,
                nutrientAmounts: nutrientAmounts
            });
            if (err != null) console.log(err);
        });

        return section;
    }

    #createNutrientCreationSection() {
        const view = document.getElementById("nutrient-creation-section-template").content.cloneNode(true).firstElementChild;

        const list = view.querySelector("#nutrient-item-list");
        const createButton = view.querySelector("#create-nutrient-button");
        const nameInput = view.querySelector("#nutrient-name-input");
        const unitInput = view.querySelector("#nutrient-unit-input");
        
        createButton.addEventListener("click", () => {
            const data = {
                name: nameInput.value.trim(), 
                unit: unitInput.value
            };

            const dataErr = this.#app.validateNutrientData(data);
            if (dataErr != null) {
                console.log(`Error creating nutrient:\n${dataErr}`);
                return;
            }
            const nutrient = this.#app.nutrient(data)

            const saveErr = this.#app.trySaveNutrient(nutrient);
            if (saveErr != null) {
                console.log(`Error saving nutrient:\n${saveErr}`);
                return;
            }

            list.append(this.#createNutrientItem(nutrient));
        });

        this.#app.getNutrients().forEach(nutrient => {
            list.append(this.#createNutrientItem(nutrient));
        });

        return view;
    }

    //#endregion

    //#region items, components

    #createIncrementalList(emptyListText, buttonText, createItemFunction, functionParams) {
        const view = document.getElementById("incremental-list-template").content.cloneNode(true).firstElementChild;
        const list = view.querySelector("[data-role='internal-list']");
        const text = view.querySelector("[data-role='empty-message']");
        const button = view.querySelector("[data-role='button']");

        text.textContent = emptyListText;
        button.textContent = buttonText;

        function updateBackgroundTextVisibility() {
            if (list.children.length > 0) 
                text.classList.add("hidden");
            else 
                text.classList.remove("hidden");
        }

        button.addEventListener("click", () => {
            if (createItemFunction) 
                list.append(createItemFunction({
                    ...functionParams, 
                    onDelete: updateBackgroundTextVisibility
                }));
            updateBackgroundTextVisibility();
        });

        updateBackgroundTextVisibility();

        return {view, list};
    }

    #createRecordedMealDisplayItem(recordedMeal) {
        console.log("creating recorded meal display item. data:")
        console.log(recordedMeal);


        const meal = this.#app.getMealById(recordedMeal.mealId);
        if (!meal) return null;
        const item = this.#createMealDisplayItem(meal);
        const dateDiv = item.querySelector("[data-role='meal-date']");
        const timeDiv = item.querySelector("[data-role='meal-time']");
        dateDiv.classList.remove("hidden");
        timeDiv.classList.remove("hidden");

        const dateObj = new Date(recordedMeal.date);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }).toUpperCase();

        dateDiv.textContent = dateStr;
        timeDiv.textContent = timeStr;

        return item;
    }

    #createMealDisplayItem(meal) {
        const item = document.getElementById("meal-display-item-template").content.cloneNode(true).firstElementChild;
        const mealNameDiv = item.querySelector("[data-role='meal-name']");
        const ingredientAmountsList = item.querySelector("[data-role='ingredient-list']");
        const nutrientTotalsList = item.querySelector("[data-role='nutrient-totals']");

        mealNameDiv.textContent = meal.name;

        const cumulativeNutrientAmounts = {}; // The total amount of each nutrient in the meal

        meal.ingredientAmounts.forEach(ia => {
            const {view, calculatedNutrientAmounts} = this.#createIngredientAmountDisplayItem(ia)
            if (view) ingredientAmountsList.append(view);

            // Accumulate each nutrient amount for this ingredient
            calculatedNutrientAmounts.forEach(cna => {
                //cumulativeNutrientAmounts[cna.nutrient.id] = (cumulativeNutrientAmounts[cna.nutrient.id] ?? 0) + Number(cna.amount);
                if (cumulativeNutrientAmounts[cna.nutrient.id] == null) cumulativeNutrientAmounts[cna.nutrient.id] = {};
                cumulativeNutrientAmounts[cna.nutrient.id].name = cna.nutrient.name;
                cumulativeNutrientAmounts[cna.nutrient.id].unit = cna.nutrient.unit;
                cumulativeNutrientAmounts[cna.nutrient.id].amount = (cumulativeNutrientAmounts[cna.nutrient.id].amount ?? 0) + Number(cna.amount);
            });
        });


        Object.entries(cumulativeNutrientAmounts).forEach(pair => {
            // Round all nutrient values to 1dp as it worsens UX otherwise
            cumulativeNutrientAmounts[pair[0]].amount = Math.trunc(pair[1].amount * 10) / 10;

            const div = document.createElement("div");
            div.classList.add("meal-display-item-nutrient-total");
            div.textContent = `${pair[1].name}: ${pair[1].amount}${pair[1].unit}`;

            nutrientTotalsList.append(div);
        });

        console.log("nutrient totals:");
        console.log(cumulativeNutrientAmounts);

        return item;
    };

    #createNutrientAmountCreationItem(params) {
        const {onDelete, chosenNutrientIds} = params;
        const item = document.getElementById("nutrient-amount-creation-item-template").content.cloneNode(true).firstElementChild;
        const selector = item.querySelector("[data-role='nutrient']");
        const amountInput = item.querySelector("[data-role='amount']");
        const deleteButton = item.querySelector("[data-role='delete']");

        let nutrientId = null;

        const buildSelectorOptions = () => {
            selector.innerHTML = "";
            const nutrients = this.#app.getNutrients();
            nutrients.forEach(nutrient => {
                if (chosenNutrientIds.has(nutrient.id) && nutrientId !== nutrient.id)
                    return; // skip to next iteration
                const option = document.createElement("option");
                option.value = nutrient.id;
                option.textContent = `${nutrient.name} (${nutrient.unit})`;
                selector.append(option);
            });
        };
        const updatePlaceholderText = () => {
            if (nutrientId == null) 
                amountInput.placeholder = "Amount";
            else {
                const unit = this.#app.getNutrients().find(n => n.id === nutrientId)?.unit;
                amountInput.placeholder = unit ? `Amount in ${unit}` : "Amount";
            }
        };

        selector.addEventListener("change", () => {
            if (nutrientId != null) chosenNutrientIds.delete(nutrientId);
            nutrientId = selector.value;
            if (nutrientId) chosenNutrientIds.add(nutrientId);
            updatePlaceholderText();
        });
        selector.addEventListener("focus", () => {
            buildSelectorOptions();
        });

        function updateSelector() {
            buildSelectorOptions();
            selector.dispatchEvent(new Event("change"));
        }
        this.#on("nutrientsUpdated", updateSelector);

        deleteButton.addEventListener("click", () => {
            item.remove();
            chosenNutrientIds.delete(nutrientId)
            this.#off("nutrientsUpdated", updateSelector);
            onDelete?.();
        });
        
        updateSelector()

        return item;
    }

    #createIngredientAmountDisplayItem(ingredientAmount) {
        const {ingredientId, amount} = ingredientAmount;
        const ingredient = this.#app.getIngredientById(ingredientId);

        if (!ingredient) return {view: null, calculatedNutrientAmounts: []};

        const view = document.getElementById("ingredient-amount-display-item-template").content.cloneNode(true).firstElementChild;
        const nameDiv = view.querySelector("[data-role='name']");
        const amountDiv = view.querySelector("[data-role='amount']");
        const nutrientsDiv = view.querySelector("[data-role='nutrient-amounts']");

        nameDiv.textContent = ingredient.name;
        amountDiv.textContent = `${amount}g`;

        const noOfIngredientUnits = (amount/ingredient.grams);

        const macroTextArr = [];
        let calculatedNutrientAmounts = ingredient.nutrientAmounts.map(
            na => { 
                const nutrient = this.#app.getNutrientById(na.nutrientId);
                if (!nutrient) return null;
                const obj = {
                    amount: na.amount * noOfIngredientUnits, 
                    nutrient
                }
                macroTextArr.push(`${obj.nutrient.name} ${Math.trunc(obj.amount*10)/10}${obj.nutrient.unit}`);
                return obj;
            }
        );
        calculatedNutrientAmounts = calculatedNutrientAmounts.filter(cna => cna != null);
        nutrientsDiv.textContent = macroTextArr.join(", ");

        return {view, calculatedNutrientAmounts};
    }

    #createIngredientAmountCreationItem(params) {
        const {onDelete, chosenIngredientIds} = params;
        const item = document.getElementById("ingredient-amount-creation-item-template").content.cloneNode(true).firstElementChild;
        const selector = item.querySelector("[data-role='ingredient']");
        const amountInput = item.querySelector("[data-role='amount']");
        const deleteButton = item.querySelector("[data-role='delete']");

        amountInput.placeholder = "Amount in grams";

        let ingredientId = null;

        const buildSelectorOptions = () => {
            selector.innerHTML = "";
            const ingredients = this.#app.getIngredients();
            ingredients.forEach((ingredient, index) => {
                if (chosenIngredientIds.has(ingredient.id) && ingredientId !== ingredient.id)
                    return; // skip to next iteration
                const option = document.createElement("option");
                option.value = ingredient.id;
                option.textContent = `${ingredient.name}`;
                selector.append(option);
            });
        };

        selector.addEventListener("change", () => {
            if (ingredientId != null) chosenIngredientIds.delete(ingredientId);
            ingredientId = selector.value;
            if (ingredientId) chosenIngredientIds.add(ingredientId);
        });
        selector.addEventListener("focus", () => {
            buildSelectorOptions();
        });
        
        function updateSelector() {
            buildSelectorOptions();
            selector.dispatchEvent(new Event("change"));
        }
        this.#on("ingredientsUpdated", updateSelector);

        deleteButton.addEventListener("click", () => {
            item.remove();
            chosenIngredientIds.delete(ingredientId)
            this.#off("ingredientsUpdated", updateSelector)
            onDelete?.();
        });
        
        updateSelector();

        return item;
    }

    #createNutrientItem(nutrient) {
        const item = document.getElementById("nutrient-item-template").content.cloneNode(true).firstElementChild;

        item.querySelector("[data-output='name']").textContent = nutrient.name;
        item.querySelector("[data-output='unit']").textContent = nutrient.unit;

        item.querySelector("[data-role='delete']").addEventListener("click", () => {
            item.remove();
            this.#app.deleteNutrientById(nutrient.id);
        });

        return item;
    }

    #createIngredientItem(ingredient) {
        const item = document.getElementById("ingredient-item-template").content.cloneNode(true).firstElementChild;
        const nameDiv = item.querySelector("[data-role='name']");
        const gramsDiv = item.querySelector("[data-role='grams']");
        const list = item.querySelector("[data-role='nutrient-list']");
        const deleteButton = item.querySelector("[data-role='delete']");

        nameDiv.textContent = ingredient.name;
        gramsDiv.textContent = `Per ${ingredient.grams}g`;

        ingredient.nutrientAmounts.forEach(na => {
            const nItem = this.#createNutrientAmountDisplayItem(na)
            if (nItem != null) list.append(nItem);
        });

        deleteButton.addEventListener("click", () => {
            this.#app.deleteIngredientById(ingredient.id);
        });

        return item;
    }

    #createNutrientAmountDisplayItem(nutrientAmount) {
        const {nutrientId, amount} = nutrientAmount;
        const nutrient = this.#app.getNutrientById(nutrientId);
        if (nutrient == null) return null;
        const {name, unit} = nutrient;

        const item = document.getElementById("nutrient-amount-display-item-template").content.cloneNode(true).firstElementChild;
        const labelDiv = item.querySelector("[data-role='label']");

        labelDiv.textContent = `${name}: ${amount}${unit}`;
        return item;
    }

    //#endregion
};