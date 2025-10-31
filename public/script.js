const loginForm = document.getElementById("login-form");
const createAccountForm = document.getElementById("create-account-form");
const todoMain = document.getElementById("todo-main");
const formMain = document.getElementById("form-main");
const createUsenameInput = document.getElementById("create-username-input");
const createPasswordInput = document.getElementById("create-password-input");
const loginUsernameInput = document.getElementById("login-username-input");
const loginPasswordInput = document.getElementById("login-password-input");

const showCreateAccountLink = document.getElementById("show-create-account-link");
const showLoginLink = document.getElementById("show-login-link");

const toDoForm = document.getElementById("add-todo");

const todoBody = document.getElementById("todos");


function setCookie(name, value, maxAgeSeconds, path = "/", sameSite = "Lax") {
    document.cookie =
        `${encodeURIComponent(name)}=${encodeURIComponent(value)};` +
        ` Max-Age=${maxAgeSeconds}; Path=${path}; SameSite=${sameSite}`;
}

function getCookie(name) {
    const target = encodeURIComponent(name) + "=";
    const parts = document.cookie.split("; ");
    for (const p of parts) {
        if (p.indexOf(target) === 0) return decodeURIComponent(p.substring(target.length));
    }
    return null;
}
function deleteCookie(name, path = "/") {
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=${path}`;
}





async function postTodo(toDotext, userId) {
    try {
        const response = await fetch("http://localhost:3000/todos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: toDotext, user_id: userId })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error posting data:", error);
    }
}

async function createAccount(username, password) {
    try {
        await fetch("http://localhost:3000/user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username, password: password })
        })
    } catch (error) {
        console.log(error)
    }
}



function showLoginForm() {
    loginForm.style.display = "flex";
    createAccountForm.style.display = "none";
    todoMain.classList.add('screen-hidden');
    todoMain.style.display = "none";
}

function showCreateAccountForm() {
    loginForm.style.display = "none";
    createAccountForm.style.display = "flex";
    todoMain.classList.add('screen-hidden');
    todoMain.style.display = "none";
}

function showTodoMain() {
    loginForm.style.display = "none";
    createAccountForm.style.display = "none";
    todoMain.style.display = "block";
    todoMain.classList.remove('screen-hidden');

    formMain.style.display = "none";
}



showCreateAccountLink.addEventListener("click", showCreateAccountForm);
showLoginLink.addEventListener("click", showLoginForm)


window.onload = function () {
    const userId = getCookie("userId")
    if (userId) {
        showTodoMain();
        loadTodos(userId);

    } else {
        showLoginForm();
    }
}


createAccountForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const usernameText = createUsenameInput.value.trim();
    const passwordText = createPasswordInput.value.trim();
    createAccount(usernameText, passwordText);
    //we prevent default so we must clear manually
    createUsenameInput.value = '';
    createPasswordInput.value = '';
    showLoginForm();
});



async function deleteTodo(todoId) {
    try {
        const res = await fetch(`http://localhost:3000/todos/${todoId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);

        const userId = getCookie("userId")
        await loadTodos(userId); // refresh this user's todos
    } catch (err) {
        console.error(err);
        alert("Could not delete todo.");
    }
}

async function updateTodo(id, done) {
    try {
        const res = await fetch(`http://localhost:3000/todos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done })
        });
        if (!res.ok) throw new Error(`Patch failed (${res.status})`);

    } catch (err) {
        console.error(err);

    }
}




async function loadTodos(user_id) {
    const userId = getCookie("userId")
    if (!userId) return;

    try {
        const response = await fetch(`http://localhost:3000/user/todos/${user_id}`);
        if (!response.ok) throw new Error("Failed to load todos");

        const todos = await response.json();
        if (!Array.isArray(todos)) throw new Error("Todos response is not an array");

        todoBody.innerHTML = "";
        todos.forEach((todo) => {
            const toDo = document.createElement("div");
            toDo.classList.add("toDo");
            toDo.innerHTML = `
        <div class="check-and-text">
         <input type="checkbox"
           name="done"
           ${todo.done ? "checked" : ""}
           onchange="updateTodo(${todo.id}, this.checked)">
          <span>${todo.text}</span>
        </div>
        <button class="delete-todo" onclick="deleteTodo(${todo.id})">🗑️</button>
      `;
            todoBody.appendChild(toDo);
        });
    } catch (error) {
        console.log(error);
        alert("Could not load todos.");
    }
}


loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usernameVal = loginUsernameInput.value.trim();
    const passwordVal = loginPasswordInput.value.trim();

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameVal, password: passwordVal })
        });

        if (!response.ok) {
            alert("Incorrect credentials");
            return; // stay on the login screen if incorrect
        }

        const data = await response.json();
        if (!data || data.id == null) {
            alert("Login response malformed.");
            return;
        }

        // we need a way to save the user that persists across page refreshes so local storage will do, cookies would also work
        setCookie("userId", String(data.id), 3600);

        loginUsernameInput.value = "";
        loginPasswordInput.value = "";
        showTodoMain();
        loadTodos(data.id);
    } catch (error) {
        console.error(error);
        alert("Network error. Please try again.");
    }
});

toDoForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let textInput = document.getElementById("todo-input")

    let userId = getCookie("userId");
    let text = textInput.value.trim();



    postTodo(text, userId);
    textInput.value = "";



    loadTodos(userId);


})





