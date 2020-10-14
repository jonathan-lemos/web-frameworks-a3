const byId = (id) => {
    const res = document.getElementById(id);
    if (res === null) {
        throw new Error(`No element with id ${id}.`);
    }
    return res;
};
const query = (selector) => {
    const res = document.querySelector(selector);
    if (res === null) {
        throw new Error(`No element matching selector ${selector}.`);
    }
    return res;
};
const queryAll = (selector) => [...document.querySelectorAll(selector)];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const flash = async (e) => {
    e.classList.add("flashing");
    await delay(500);
    e.classList.remove("flashing");
};
const ajaxJson = (url, method, body) => new Promise(async (resolve, reject) => {
    const res1 = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body ? JSON.stringify(body) : undefined
    });
    resolve(await res1.json());
});
const ajax = (url, method) => new Promise(async (resolve, reject) => {
    const res1 = await fetch(url, {
        method: method,
    });
    resolve(await res1.json());
});
;
// we have react at home
class Row {
    constructor(u) {
        this.user = u;
        this.domNode = document.createElement("tr");
        this._editing = true;
        this.editing = false;
    }
    get node() {
        return this.domNode;
    }
    get editing() {
        return this._editing;
    }
    set editing(b) {
        if (this._editing === b)
            return;
        this._editing = b;
        if (b) {
            this.domNode.innerHTML = `
                <td>
                    <span class="text UserID">${this.user.UserID}</span>
                </td>
                <td>
                    <input class="w-100" type="text" name="FirstName" placeholder="${this.user.FirstName}">
                </td>
                <td>
                    <input class="w-100" type="text" name="LastName" placeholder="${this.user.LastName}">
                </td>
                <td>
                    <input class="w-100" type="text" name="EmailAddress" placeholder="${this.user.EmailAddress}">
                </td>
                <td>
                    <input class="w-100" type="text" name="Password" placeholder="${this.user.Password}">
                </td>
                <td>
                    <button class="green">Save</button>
                </td>
                <td>
                    <button class="red">Cancel</button>
                </td>
                `;
            this.domNode.querySelector("button.green").onclick = async () => {
                var _a;
                const user = {
                    FirstName: this.domNode.querySelector('input[name="FirstName"]').value,
                    LastName: this.domNode.querySelector('input[name="LastName"]').value,
                    EmailAddress: this.domNode.querySelector('input[name="EmailAddress"]').value,
                    Password: this.domNode.querySelector('input[name="Password"]').value,
                };
                let good = false;
                for (const key in user) {
                    const node = this.domNode.querySelector(`input[name="${key}"]`);
                    if (node == null)
                        continue;
                    if ((_a = node.value) === null || _a === void 0 ? void 0 : _a.trim()) {
                        good = true;
                    }
                }
                if (good) {
                    console.log(await ajaxJson(`/User/${this.user.UserID}`, "PATCH", user));
                    await renderRows();
                }
            };
            this.domNode.querySelector("button.red").onclick = () => {
                this.editing = false;
            };
        }
        else {
            this.domNode.innerHTML = `
                <td>
                    <span class="text UserID">${this.user.UserID}</span>
                </td>
                <td>
                    <span class="text FirstName">${this.user.FirstName}</span>
                </td>
                <td>
                    <span class="text LastName">${this.user.LastName}</span>
                </td>
                <td>
                    <span class="text EmailAddress">${this.user.EmailAddress}</span>
                </td>
                <td>
                    <span class="text Password">${this.user.Password}</span>
                </td>
                <td>
                    <button class="green">Edit</button>
                </td>
                <td>
                    <button class="red">Delete</button>
                </td>
                `;
            this.domNode.querySelector("button.green").onclick = () => {
                this.editing = true;
            };
            const func = () => {
                const bg = this.domNode.querySelector("button.green");
                const br = this.domNode.querySelector("button.red");
                bg.innerText = "Confirm Delete";
                br.innerText = "Cancel";
                bg.onclick = async () => {
                    console.log(await ajax(`/User/${this.user.UserID}`, "DELETE"));
                    await renderRows();
                };
                br.onclick = async () => {
                    bg.onclick = () => this.editing = true;
                    br.onclick = func;
                    bg.innerText = "Edit";
                    br.innerText = "Delete";
                };
            };
            this.domNode.querySelector("button.red").onclick = func;
        }
    }
}
const getUsers = () => new Promise(async (resolve, reject) => {
    resolve(await ajax("/Users", "GET"));
});
const renderRows = async () => {
    const rc = query("#users > tbody");
    [...rc.children].filter(x => x.id !== "new-user").forEach(c => rc.removeChild(c));
    for (const u of await getUsers()) {
        const newRow = new Row(u);
        byId("new-user").parentElement.insertBefore(newRow.node, byId("new-user"));
    }
};
byId("new-user").querySelector("button.green").onclick = async () => {
    var _a;
    const row = byId("new-user");
    const user = {
        UserID: row.querySelector('input[name="UserID"]').value,
        FirstName: row.querySelector('input[name="FirstName"]').value,
        LastName: row.querySelector('input[name="LastName"]').value,
        EmailAddress: row.querySelector('input[name="EmailAddress"]').value,
        Password: row.querySelector('input[name="Password"]').value,
    };
    let good = true;
    for (const key in user) {
        const node = row.querySelector(`input[name="${key}"]`);
        if (node == null)
            continue;
        if (!((_a = node.value) === null || _a === void 0 ? void 0 : _a.trim())) {
            flash(node);
            good = false;
        }
    }
    if (good) {
        console.log(await ajaxJson(`/User`, "POST", user));
        row.querySelectorAll("input").forEach(x => x.value = "");
        await renderRows();
    }
};
renderRows();
//# sourceMappingURL=script.js.map