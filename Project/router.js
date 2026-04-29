class Router {

    #onNavigate = null;

    constructor() {
        window.addEventListener("hashchange", () => {
            this.#handleCurrentHash();
        });
    }

    init() {
        this.#handleCurrentHash();
    }

    onNavigate(callback) {
        this.#onNavigate = callback;
    }

    navigate(pageName, params = {}) {
        const route = this.#createRoute(pageName, params);

        if (window.location.hash != route) {
            window.location.hash = route;
        }
    }

    #handleCurrentHash() {
        const route = window.location.hash;
        const {page, params} = this.#readRoute(route);

        if (this.#onNavigate) this.#onNavigate(page, params);
    }

    #readRoute(route) {
        const hash = route.includes('#') ? 
            route.split('#')[1] :
            route;
        const separated = hash.split('?');
        const params = separated[1] ?
            new URLSearchParams(separated[1]) :
            {};
        const page = separated[0] ?? "";
        return {page, params};
    }

    #createRoute(pageName, params) {
        const route = `${pageName}${new URLSearchParams(params).toString()}`
        return route;
    }
};