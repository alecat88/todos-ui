<template>
  <div class="home">
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input
          class="new-todo"
          autofocus
          autocomplete="off"
          placeholder="What needs to be done?"
          v-model="newTodo"
          @keyup.enter="addTodo"
        />
      </header>
      <section class="main" v-show="todos.length" v-cloak>
        <input
          id="toggle-all"
          class="toggle-all"
          type="checkbox"
          v-model="allDone"
        />
        <label for="toggle-all"></label>
        <ul class="todo-list">
          <li
            v-for="todo in filteredTodos"
            class="todo"
            :key="todo.id"
            :class="{ completed: todo.completed, editing: todo == editedTodo }"
          >
            <div class="view">
              <input
                class="toggle"
                type="checkbox"
                v-model="todo.completed"
                @click="doneEdit({ ...todo, completed: !todo.completed })"
              />
              <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
              <button class="destroy" @click="removeTodo(todo)"></button>
            </div>
            <input
              class="edit"
              type="text"
              v-model="todo.title"
              v-todo-focus="todo == editedTodo"
              @blur="doneEdit(todo)"
              @keyup.enter="doneEdit(todo)"
              @keyup.esc="cancelEdit(todo)"
            />
          </li>
        </ul>
      </section>
      <footer class="footer" v-show="todos.length" v-cloak>
        <span class="todo-count">
          <strong>{{ remaining }}</strong> {{ remaining | pluralize }} left
        </span>
        <ul class="filters">
          <li>
            <a
              @click="visibility = 'all'"
              :class="{ selected: visibility == 'all' }"
              >All</a
            >
          </li>
          <li>
            <a
              @click="visibility = 'active'"
              :class="{ selected: visibility == 'active' }"
              >Active</a
            >
          </li>
          <li>
            <a
              @click="visibility = 'completed'"
              :class="{ selected: visibility == 'completed' }"
              >Completed</a
            >
          </li>
        </ul>
        <button
          class="clear-completed"
          @click="removeCompleted"
          v-show="todos.length > remaining"
        >
          Clear completed
        </button>
      </footer>
    </section>
  </div>
</template>

<script>
// var STORAGE_KEY = "todos-vuejs-2.0";
// var todoStorage = {
//   fetch: function() {
//     var todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
//     todos.forEach(function(todo, index) {
//       todo.id = index;
//     });
//     todoStorage.uid = todos.length;
//     return todos;
//   },
//   save: function(todos) {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
//   }
// };

// visibility filters
var filters = {
  all: function(todos) {
    return todos;
  },
  active: function(todos) {
    return todos.filter(function(todo) {
      return !todo.completed;
    });
  },
  completed: function(todos) {
    return todos.filter(function(todo) {
      return todo.completed;
    });
  }
};

import { GET_TODOS } from "@/api/query";
import { CREATE_TODO, UPDATE_TODO, DELETE_TODO } from "@/api/mutation";
// import { CREATE_TODO } from "@/api/mutation";

export default {
  name: "Home",
  data() {
    return {
      todos: [],
      newTodo: "",
      editedTodo: null,
      visibility: "all",
      todoQuery: null
    };
  },

  // watch todos change for localStorage persistence
  // watch: {
  //   todos: {
  //     handler: function(todos) {
  //       console.log(todos);
  //       // todoStorage.save(todos);
  //     },
  //     deep: true
  //   }
  // },

  // computed properties
  // http://vuejs.org/guide/computed.html
  computed: {
    filteredTodos: function() {
      return filters[this.visibility](this.todos);
    },
    remaining: function() {
      return filters.active(this.todos).length;
    },
    allDone: {
      get: function() {
        return this.remaining === 0;
      },
      set: function(value) {
        this.todos.forEach(todo => {
          todo.completed = value;
          this.doneEdit({ ...todo, completed: value });
        });
      }
    }
  },

  filters: {
    pluralize: function(n) {
      return n === 1 ? "item" : "items";
    }
  },

  // methods that implement data logic.
  // note there's no DOM manipulation here at all.
  methods: {
    addTodo: function() {
      var value = this.newTodo && this.newTodo.trim();
      if (!value) {
        return;
      }
      this.$apollo
        .mutate({
          mutation: CREATE_TODO,
          variables: {
            text: value
          }
        })
        .then(({ data }) => {
          // console.log(data.todoMutation.createTodo.id);
          this.todos.unshift({
            id: data.todoMutation.createTodo.id,
            title: value,
            completed: false
          });
          this.newTodo = "";
        });
    },

    removeTodo: function(todo) {
      this.$apollo
        .mutate({
          mutation: DELETE_TODO,
          variables: {
            id: todo.id
          }
        })
        .then(() => {
          this.todos.splice(this.todos.indexOf(todo), 1);
        });
    },

    editTodo: function(todo) {
      this.editedTodo = todo;
      this.beforeEditCache = todo.title;
    },

    doneEdit: function(todo) {
      console.log("doneEdit", todo);
      // if (!this.editedTodo) {
      //   return;
      // }
      console.log("todo", todo, this.editedTodo);
      console.log(UPDATE_TODO);
      this.$apollo
        .mutate({
          mutation: UPDATE_TODO,
          variables: {
            id: todo.id,
            text: todo.title,
            completed: todo.completed
          }
        })
        .then(() => {
          this.editedTodo = null;
        });
      todo.title = todo.title.trim();
      if (!todo.title) {
        this.removeTodo(todo);
      }
    },

    cancelEdit: function(todo) {
      this.editedTodo = null;
      todo.title = this.beforeEditCache;
    },

    removeCompleted: function() {
      this.todos
        .filter(todo => todo.completed === true)
        .forEach(todo => this.removeTodo(todo));
      this.todos = filters.active(this.todos);
    }
  },

  // a custom directive to wait for the DOM to be updated
  // before focusing on the input field.
  // http://vuejs.org/guide/custom-directive.html
  directives: {
    "todo-focus": function(el, binding) {
      if (binding.value) {
        el.focus();
      }
    }
  },
  apollo: {
    todoQuery() {
      return {
        query: GET_TODOS,
        result: result => {
          console.log("result GET_TODOS", result);
          this.todos = result.data.todoQuery.todos.reverse();
        },
        fetchPolicy: "no-cache"
      };
    }
  }
};
</script>

<style scoped>
.todo-list li .toggle {
  left: 0;
  cursor: pointer;
}
button.destroy,
.filters li {
  cursor: pointer;
}
</style>
