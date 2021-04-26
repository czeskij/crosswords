
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const app$1 = writable({
        editMode: false
    });

    const crossword = writable({});

    const selectedFields = writable([]);

    function areFieldsEqual(first, second) {
        return first.every((value, index) => value === second[index]);
    }

    function isFieldSelected(fields, changedField) {
        return fields.some(field => areFieldsEqual(field, changedField));
    }

    /* src/Field.svelte generated by Svelte v3.37.0 */
    const file$5 = "src/Field.svelte";

    // (55:4) {#if !isBlack}
    function create_if_block$3(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*number*/ ctx[0] && create_if_block_2(ctx);
    	let if_block1 = /*isPassword*/ ctx[1] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*number*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isPassword*/ ctx[1]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(55:4) {#if !isBlack}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#if number}
    function create_if_block_2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*number*/ ctx[0]);
    			attr_dev(div, "class", "number svelte-kk5atl");
    			add_location(div, file$5, 56, 12, 1502);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*number*/ 1) set_data_dev(t, /*number*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(56:8) {#if number}",
    		ctx
    	});

    	return block;
    }

    // (59:8) {#if isPassword}
    function create_if_block_1$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "is-password svelte-kk5atl");
    			add_location(div, file$5, 59, 12, 1588);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(59:8) {#if isPassword}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let if_block = !/*isBlack*/ ctx[2] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "style", /*style*/ ctx[5]);
    			attr_dev(div, "class", "field svelte-kk5atl");
    			add_location(div, file$5, 53, 0, 1371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*isBlack*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*style*/ 32) {
    				attr_dev(div, "style", /*style*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let isSelected;
    	let style;
    	let $selectedFields;
    	validate_store(selectedFields, "selectedFields");
    	component_subscribe($$self, selectedFields, $$value => $$invalidate(8, $selectedFields = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Field", slots, []);
    	let { number } = $$props;
    	let { isPassword } = $$props;
    	let { isBlack } = $$props;
    	let { row } = $$props;
    	let { column } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ["number", "isPassword", "isBlack", "row", "column"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("select", [row, column]);

    	$$self.$$set = $$props => {
    		if ("number" in $$props) $$invalidate(0, number = $$props.number);
    		if ("isPassword" in $$props) $$invalidate(1, isPassword = $$props.isPassword);
    		if ("isBlack" in $$props) $$invalidate(2, isBlack = $$props.isBlack);
    		if ("row" in $$props) $$invalidate(3, row = $$props.row);
    		if ("column" in $$props) $$invalidate(4, column = $$props.column);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		selectedFields,
    		isFieldSelected,
    		number,
    		isPassword,
    		isBlack,
    		row,
    		column,
    		dispatch,
    		isSelected,
    		$selectedFields,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("number" in $$props) $$invalidate(0, number = $$props.number);
    		if ("isPassword" in $$props) $$invalidate(1, isPassword = $$props.isPassword);
    		if ("isBlack" in $$props) $$invalidate(2, isBlack = $$props.isBlack);
    		if ("row" in $$props) $$invalidate(3, row = $$props.row);
    		if ("column" in $$props) $$invalidate(4, column = $$props.column);
    		if ("isSelected" in $$props) $$invalidate(7, isSelected = $$props.isSelected);
    		if ("style" in $$props) $$invalidate(5, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedFields, row, column*/ 280) {
    			$$invalidate(7, isSelected = isFieldSelected($selectedFields, [row, column]));
    		}

    		if ($$self.$$.dirty & /*isBlack, isSelected*/ 132) {
    			$$invalidate(5, style = `
        background-color: ${isBlack ? "black" : "white"};
        z-index: ${isSelected ? "3001" : "3000"};
        box-shadow: ${isSelected ? "0 0 0px 3px red;" : "none"};
        border-right: ${isSelected ? "1px solid black" : "1px solid transparent"};
        border-bottom: ${isSelected ? "1px solid black" : "1px solid transparent"};
    `);
    		}
    	};

    	return [
    		number,
    		isPassword,
    		isBlack,
    		row,
    		column,
    		style,
    		dispatch,
    		isSelected,
    		$selectedFields,
    		click_handler
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			number: 0,
    			isPassword: 1,
    			isBlack: 2,
    			row: 3,
    			column: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*number*/ ctx[0] === undefined && !("number" in props)) {
    			console.warn("<Field> was created without expected prop 'number'");
    		}

    		if (/*isPassword*/ ctx[1] === undefined && !("isPassword" in props)) {
    			console.warn("<Field> was created without expected prop 'isPassword'");
    		}

    		if (/*isBlack*/ ctx[2] === undefined && !("isBlack" in props)) {
    			console.warn("<Field> was created without expected prop 'isBlack'");
    		}

    		if (/*row*/ ctx[3] === undefined && !("row" in props)) {
    			console.warn("<Field> was created without expected prop 'row'");
    		}

    		if (/*column*/ ctx[4] === undefined && !("column" in props)) {
    			console.warn("<Field> was created without expected prop 'column'");
    		}
    	}

    	get number() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isPassword() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isPassword(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isBlack() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isBlack(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get column() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set column(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Crossword.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1 } = globals;
    const file$4 = "src/Crossword.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (46:8) {#if Object.keys($crossword.schema).length > 0}
    function create_if_block$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*$crossword*/ ctx[0].schema);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, $crossword, toggleSelect*/ 3) {
    				each_value = Object.keys(/*$crossword*/ ctx[0].schema);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(46:8) {#if Object.keys($crossword.schema).length > 0}",
    		ctx
    	});

    	return block;
    }

    // (49:20) {#each Object.keys($crossword.schema[rowKey]) as columnKey}
    function create_each_block_1(ctx) {
    	let field;
    	let current;

    	const field_spread_levels = [
    		/*$crossword*/ ctx[0].schema[/*rowKey*/ ctx[3]][/*columnKey*/ ctx[6]],
    		{ row: /*rowKey*/ ctx[3] },
    		{ column: /*columnKey*/ ctx[6] }
    	];

    	let field_props = {};

    	for (let i = 0; i < field_spread_levels.length; i += 1) {
    		field_props = assign(field_props, field_spread_levels[i]);
    	}

    	field = new Field({ props: field_props, $$inline: true });
    	field.$on("select", /*toggleSelect*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(field.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const field_changes = (dirty & /*$crossword, Object*/ 1)
    			? get_spread_update(field_spread_levels, [
    					get_spread_object(/*$crossword*/ ctx[0].schema[/*rowKey*/ ctx[3]][/*columnKey*/ ctx[6]]),
    					{ row: /*rowKey*/ ctx[3] },
    					{ column: /*columnKey*/ ctx[6] }
    				])
    			: {};

    			field.$set(field_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(49:20) {#each Object.keys($crossword.schema[rowKey]) as columnKey}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#each Object.keys($crossword.schema) as rowKey}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = Object.keys(/*$crossword*/ ctx[0].schema[/*rowKey*/ ctx[3]]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "field-group svelte-4e861q");
    			add_location(div, file$4, 47, 16, 1317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$crossword, Object, toggleSelect*/ 3) {
    				each_value_1 = Object.keys(/*$crossword*/ ctx[0].schema[/*rowKey*/ ctx[3]]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:12) {#each Object.keys($crossword.schema) as rowKey}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let show_if = Object.keys(/*$crossword*/ ctx[0].schema).length > 0;
    	let current;
    	let if_block = show_if && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "crossword svelte-4e861q");
    			add_location(div0, file$4, 44, 4, 1160);
    			attr_dev(div1, "class", "crossword-editor svelte-4e861q");
    			add_location(div1, file$4, 43, 0, 1125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$crossword*/ 1) show_if = Object.keys(/*$crossword*/ ctx[0].schema).length > 0;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$crossword*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $selectedFields;
    	let $crossword;
    	validate_store(selectedFields, "selectedFields");
    	component_subscribe($$self, selectedFields, $$value => $$invalidate(2, $selectedFields = $$value));
    	validate_store(crossword, "crossword");
    	component_subscribe($$self, crossword, $$value => $$invalidate(0, $crossword = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Crossword", slots, []);

    	function toggleSelect(event) {
    		const changedField = event.detail;

    		if (isFieldSelected($selectedFields, changedField)) {
    			selectedFields.update(prev => prev.filter(field => !areFieldsEqual(field, changedField)));
    		} else {
    			selectedFields.update(prev => [...prev, changedField]);
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Crossword> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		crossword,
    		selectedFields,
    		Field,
    		isFieldSelected,
    		areFieldsEqual,
    		toggleSelect,
    		$selectedFields,
    		$crossword
    	});

    	return [$crossword, toggleSelect];
    }

    class Crossword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Crossword",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/FieldSettings.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/FieldSettings.svelte";

    // (91:4) {#if $selectedFields.length >= 1}
    function create_if_block_1$1(ctx) {
    	let button;
    	let t1;
    	let div;
    	let label;
    	let t3;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Deselect";
    			t1 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Is field black?";
    			t3 = space();
    			input = element("input");
    			add_location(button, file$3, 91, 8, 2583);
    			attr_dev(label, "for", "is-black");
    			add_location(label, file$3, 93, 12, 2674);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "is-black");
    			input.value = /*areFieldsBlack*/ ctx[3];
    			add_location(input, file$3, 94, 12, 2732);
    			attr_dev(div, "class", "setting svelte-1hfq426");
    			add_location(div, file$3, 92, 8, 2640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t3);
    			append_dev(div, input);
    			/*input_binding*/ ctx[7](input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*deselectAll*/ ctx[5], false, false, false),
    					listen_dev(input, "change", /*toggleBlack*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*areFieldsBlack*/ 8) {
    				prop_dev(input, "value", /*areFieldsBlack*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(91:4) {#if $selectedFields.length >= 1}",
    		ctx
    	});

    	return block;
    }

    // (103:4) {#if $selectedFields.length === 1}
    function create_if_block$1(ctx) {
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let label1;
    	let t4;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Number";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Is for password?";
    			t4 = space();
    			input1 = element("input");
    			attr_dev(label0, "for", "field-number");
    			add_location(label0, file$3, 104, 12, 3038);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "field-number");
    			add_location(input0, file$3, 105, 12, 3091);
    			attr_dev(div0, "class", "setting svelte-1hfq426");
    			add_location(div0, file$3, 103, 8, 3004);
    			attr_dev(label1, "for", "is-password");
    			add_location(label1, file$3, 111, 12, 3326);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "name", "is-password");
    			add_location(input1, file$3, 112, 12, 3388);
    			attr_dev(div1, "class", "setting svelte-1hfq426");
    			add_location(div1, file$3, 110, 8, 3292);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*$crossword*/ ctx[2].schema[/*$selectedFields*/ ctx[0][0][0]][/*$selectedFields*/ ctx[0][0][1]].number);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*$crossword*/ ctx[2].schema[/*$selectedFields*/ ctx[0][0][0]][/*$selectedFields*/ ctx[0][0][1]].isPassword);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$crossword, $selectedFields*/ 5 && to_number(input0.value) !== /*$crossword*/ ctx[2].schema[/*$selectedFields*/ ctx[0][0][0]][/*$selectedFields*/ ctx[0][0][1]].number) {
    				set_input_value(input0, /*$crossword*/ ctx[2].schema[/*$selectedFields*/ ctx[0][0][0]][/*$selectedFields*/ ctx[0][0][1]].number);
    			}

    			if (dirty & /*$crossword, $selectedFields*/ 5) {
    				set_input_value(input1, /*$crossword*/ ctx[2].schema[/*$selectedFields*/ ctx[0][0][0]][/*$selectedFields*/ ctx[0][0][1]].isPassword);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(103:4) {#if $selectedFields.length === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*$selectedFields*/ ctx[0].length >= 1 && create_if_block_1$1(ctx);
    	let if_block1 = /*$selectedFields*/ ctx[0].length === 1 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "field-settings svelte-1hfq426");
    			add_location(div, file$3, 89, 0, 2508);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedFields*/ ctx[0].length >= 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$selectedFields*/ ctx[0].length === 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let areFieldsBlack;
    	let areFieldsIndeterminate;
    	let $crossword;
    	let $selectedFields;
    	validate_store(crossword, "crossword");
    	component_subscribe($$self, crossword, $$value => $$invalidate(2, $crossword = $$value));
    	validate_store(selectedFields, "selectedFields");
    	component_subscribe($$self, selectedFields, $$value => $$invalidate(0, $selectedFields = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FieldSettings", slots, []);

    	function areAllFieldsBlack(fields) {
    		return fields.every(field => {
    			const [row, column] = field;
    			return $crossword.schema[row][column].isBlack;
    		});
    	}

    	function areAllFieldsWhite(fields) {
    		return fields.every(field => {
    			const [row, column] = field;
    			return !$crossword.schema[row][column].isBlack;
    		});
    	}

    	let isBlackCheckbox;

    	function toggleBlack() {
    		if (areFieldsIndeterminate) {
    			return $selectedFields.forEach(field => {
    				const [row, column] = field;

    				crossword.update(prev => ({
    					...prev,
    					schema: {
    						...prev.schema,
    						[row]: {
    							...prev.schema[row],
    							[column]: {
    								...prev.schema[row][column],
    								isBlack: true
    							}
    						}
    					}
    				}));
    			});
    		}

    		return $selectedFields.forEach(field => {
    			const [row, column] = field;

    			crossword.update(prev => ({
    				...prev,
    				schema: {
    					...prev.schema,
    					[row]: {
    						...prev.schema[row],
    						[column]: {
    							...prev.schema[row][column],
    							isBlack: !prev.schema[row][column].isBlack
    						}
    					}
    				}
    			}));
    		});
    	}

    	function deselectAll() {
    		selectedFields.set([]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FieldSettings> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			isBlackCheckbox = $$value;
    			(($$invalidate(1, isBlackCheckbox), $$invalidate(6, areFieldsIndeterminate)), $$invalidate(0, $selectedFields));
    		});
    	}

    	function input0_input_handler() {
    		$crossword.schema[$selectedFields[0][0]][$selectedFields[0][1]].number = to_number(this.value);
    		crossword.set($crossword);
    	}

    	function input1_change_handler() {
    		$crossword.schema[$selectedFields[0][0]][$selectedFields[0][1]].isPassword = this.value;
    		crossword.set($crossword);
    	}

    	$$self.$capture_state = () => ({
    		crossword,
    		selectedFields,
    		areAllFieldsBlack,
    		areAllFieldsWhite,
    		isBlackCheckbox,
    		toggleBlack,
    		deselectAll,
    		$crossword,
    		areFieldsBlack,
    		$selectedFields,
    		areFieldsIndeterminate
    	});

    	$$self.$inject_state = $$props => {
    		if ("isBlackCheckbox" in $$props) $$invalidate(1, isBlackCheckbox = $$props.isBlackCheckbox);
    		if ("areFieldsBlack" in $$props) $$invalidate(3, areFieldsBlack = $$props.areFieldsBlack);
    		if ("areFieldsIndeterminate" in $$props) $$invalidate(6, areFieldsIndeterminate = $$props.areFieldsIndeterminate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedFields*/ 1) {
    			$$invalidate(3, areFieldsBlack = areAllFieldsBlack($selectedFields));
    		}

    		if ($$self.$$.dirty & /*$selectedFields*/ 1) {
    			$$invalidate(6, areFieldsIndeterminate = !areAllFieldsBlack($selectedFields) && !areAllFieldsWhite($selectedFields));
    		}

    		if ($$self.$$.dirty & /*areFieldsIndeterminate*/ 64) {
    			if (areFieldsIndeterminate) {
    				$$invalidate(1, isBlackCheckbox.indeterminate = true, isBlackCheckbox);
    			}
    		}
    	};

    	return [
    		$selectedFields,
    		isBlackCheckbox,
    		$crossword,
    		areFieldsBlack,
    		toggleBlack,
    		deselectAll,
    		areFieldsIndeterminate,
    		input_binding,
    		input0_input_handler,
    		input1_change_handler
    	];
    }

    class FieldSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FieldSettings",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/Header.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = text("!");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "new";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "load";
    			attr_dev(h1, "class", "svelte-a1lo8d");
    			add_location(h1, file$2, 46, 4, 887);
    			attr_dev(button0, "class", "svelte-a1lo8d");
    			add_location(button0, file$2, 47, 4, 908);
    			attr_dev(button1, "class", "svelte-a1lo8d");
    			add_location(button1, file$2, 48, 4, 963);
    			attr_dev(header, "class", "svelte-a1lo8d");
    			add_location(header, file$2, 45, 0, 874);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(header, t2);
    			append_dev(header, button0);
    			append_dev(header, t4);
    			append_dev(header, button1);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*createNewCrossword*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { name } = $$props;

    	function createNewCrossword() {
    		app$1.update(() => ({ editMode: true }));
    		crossword.update(prev => ({ ...prev, dimensions: {} }));
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ crossword, app: app$1, name, createNewCrossword });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, createNewCrossword];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Header> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/InitialSettings.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/InitialSettings.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let button0;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			label0.textContent = "Rows";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "Columns";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			button0 = element("button");
    			t6 = text("Continue with ");
    			t7 = text(/*rows*/ ctx[0]);
    			t8 = text("x");
    			t9 = text(/*columns*/ ctx[1]);
    			t10 = text(" field");
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			attr_dev(label0, "for", "rows");
    			add_location(label0, file$1, 59, 4, 1226);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "rows");
    			add_location(input0, file$1, 60, 4, 1261);
    			attr_dev(label1, "for", "columns");
    			add_location(label1, file$1, 61, 4, 1319);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "columns");
    			add_location(input1, file$1, 62, 4, 1360);
    			attr_dev(button0, "class", "svelte-1ia0xan");
    			add_location(button0, file$1, 63, 4, 1424);
    			attr_dev(button1, "class", "svelte-1ia0xan");
    			add_location(button1, file$1, 64, 4, 1519);
    			attr_dev(div, "class", "settings svelte-1ia0xan");
    			add_location(div, file$1, 58, 0, 1199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(div, t1);
    			append_dev(div, input0);
    			set_input_value(input0, /*rows*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, label1);
    			append_dev(div, t4);
    			append_dev(div, input1);
    			set_input_value(input1, /*columns*/ ctx[1]);
    			append_dev(div, t5);
    			append_dev(div, button0);
    			append_dev(button0, t6);
    			append_dev(button0, t7);
    			append_dev(button0, t8);
    			append_dev(button0, t9);
    			append_dev(button0, t10);
    			append_dev(div, t11);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*continueCrosswordCreation*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*cancelCrosswordCreation*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rows*/ 1 && to_number(input0.value) !== /*rows*/ ctx[0]) {
    				set_input_value(input0, /*rows*/ ctx[0]);
    			}

    			if (dirty & /*columns*/ 2 && to_number(input1.value) !== /*columns*/ ctx[1]) {
    				set_input_value(input1, /*columns*/ ctx[1]);
    			}

    			if (dirty & /*rows*/ 1) set_data_dev(t7, /*rows*/ ctx[0]);
    			if (dirty & /*columns*/ 2) set_data_dev(t9, /*columns*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InitialSettings", slots, []);
    	let rows = 0;
    	let columns = 0;

    	const initialFieldValue = {
    		isBlack: false,
    		isPassword: false,
    		number: undefined
    	};

    	function cancelCrosswordCreation() {
    		crossword.set({});
    		app$1.update(prev => ({ ...prev, editMode: false }));
    	}

    	function continueCrosswordCreation() {
    		let schema = {};

    		for (let i = 0; i < rows; ++i) {
    			schema[i] = {};

    			for (let j = 0; j < columns; ++j) {
    				schema[i][j] = { ...initialFieldValue };
    			}
    		}

    		crossword.update(prev => ({
    			...prev,
    			dimensions: { rows, columns },
    			schema
    		}));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InitialSettings> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		rows = to_number(this.value);
    		$$invalidate(0, rows);
    	}

    	function input1_input_handler() {
    		columns = to_number(this.value);
    		$$invalidate(1, columns);
    	}

    	$$self.$capture_state = () => ({
    		app: app$1,
    		crossword,
    		rows,
    		columns,
    		initialFieldValue,
    		cancelCrosswordCreation,
    		continueCrosswordCreation
    	});

    	$$self.$inject_state = $$props => {
    		if ("rows" in $$props) $$invalidate(0, rows = $$props.rows);
    		if ("columns" in $$props) $$invalidate(1, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		rows,
    		columns,
    		cancelCrosswordCreation,
    		continueCrosswordCreation,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class InitialSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InitialSettings",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */
    const file = "src/App.svelte";

    // (26:1) {#if $app.editMode && !$crossword.schema}
    function create_if_block_1(ctx) {
    	let initialsettings;
    	let current;
    	initialsettings = new InitialSettings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(initialsettings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(initialsettings, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(initialsettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(initialsettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(initialsettings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(26:1) {#if $app.editMode && !$crossword.schema}",
    		ctx
    	});

    	return block;
    }

    // (29:1) {#if $app.editMode && $crossword.schema}
    function create_if_block(ctx) {
    	let crossword_1;
    	let t;
    	let fieldsettings;
    	let current;
    	crossword_1 = new Crossword({ $$inline: true });
    	fieldsettings = new FieldSettings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(crossword_1.$$.fragment);
    			t = space();
    			create_component(fieldsettings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(crossword_1, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(fieldsettings, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crossword_1.$$.fragment, local);
    			transition_in(fieldsettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crossword_1.$$.fragment, local);
    			transition_out(fieldsettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(crossword_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(fieldsettings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:1) {#if $app.editMode && $crossword.schema}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let header;
    	let t0;
    	let t1;
    	let current;
    	header = new Header({ props: { name }, $$inline: true });
    	let if_block0 = /*$app*/ ctx[0].editMode && !/*$crossword*/ ctx[1].schema && create_if_block_1(ctx);
    	let if_block1 = /*$app*/ ctx[0].editMode && /*$crossword*/ ctx[1].schema && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "svelte-1ddlfre");
    			add_location(div, file, 23, 0, 471);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$app*/ ctx[0].editMode && !/*$crossword*/ ctx[1].schema) {
    				if (if_block0) {
    					if (dirty & /*$app, $crossword*/ 3) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$app*/ ctx[0].editMode && /*$crossword*/ ctx[1].schema) {
    				if (if_block1) {
    					if (dirty & /*$app, $crossword*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const name = "crosswords";

    function instance($$self, $$props, $$invalidate) {
    	let $app;
    	let $crossword;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	validate_store(crossword, "crossword");
    	component_subscribe($$self, crossword, $$value => $$invalidate(1, $crossword = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Crossword,
    		FieldSettings,
    		Header,
    		InitialSettings,
    		crossword,
    		app: app$1,
    		selectedFields,
    		name,
    		$app,
    		$crossword
    	});

    	return [$app, $crossword];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
