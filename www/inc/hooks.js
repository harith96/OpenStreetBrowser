/**
 * Hooks - Functions can register to hooks and will be called on certain 
 * events in the system.
 *
 * <code>
 * function example(p) {
 *   alert("example "+p);
 * }
 * register_hook("test_hook", example);
 * </code>

 */

/**
 * Holds a list of all functions which registered a hook
 * @var array array('hook'=>array(fun, fun, fun))
 */
var hooks_intern=new Array();

/**
 * Call hooks - All registered functions will be called
 * @param text hook The hooks to be called
 * @param any vars A variable which will be passed by reference and can therefore by modified
 * @param any params Additional vars
 */
function call_hooks(hook, vars, param1, param2, param3, param4) {
  if(hooks_intern[hook])
    for(var i=0; i<hooks_intern[hook].length; i++) {
      hooks_intern[hook][i](vars, param1, param2, param3, param4);
    }
}

/**
 * Register a function to a hook
 * @param text hook The hook the function to register to
 * @param text fun The reference to the function
 */
function register_hook(hook, fun) {
  if(!hooks_intern[hook])
    hooks_intern[hook]=new Array();

  hooks_intern[hook].push(fun);
}
