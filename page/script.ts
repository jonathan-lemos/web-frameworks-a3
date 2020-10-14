const byId = (id: string) => {
    const res = document.getElementById(id);
    if (res === null) {
        throw new Error(`No element with id ${id}.`)
    }
    return res;
}

const query = (selector: string) => {
    const res = document.querySelector(selector);
    if (res === null) {
        throw new Error(`No element matching selector ${selector}.`)
    }
    return res;
}

const queryAll = (selector: string) => [...document.querySelectorAll(selector)];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const flash = async (e: HTMLElement) => {
    e.classList.add("flashing");
    await delay(500);
    e.classList.remove("flashing");
};

const ajaxJson = (url: string, method: "POST" | "PATCH", body?: Object) => new Promise<any>(async (resolve, reject) => {
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

const ajax = (url: string, method: "GET" | "DELETE") => new Promise<any>(async (resolve, reject) => {
    const res1 = await fetch(url, {
        method: method,
    });

    resolve(await res1.json());
});

interface User {
    UserID: string;
    FirstName: string;
    LastName: string;
    EmailAddress: string;
    Password: string;
};

// we have react at home
class Row {
    public user: User;
    private _editing: boolean;
    private domNode: HTMLTableRowElement;

    constructor(u: User) {
        this.user = u;
        this.domNode = document.createElement("tr");
        this._editing = true;
        this.editing = false;
    }

    public get node() {
        return this.domNode;
    }

    public get editing() {
        return this._editing;
    }

    public set editing(b: boolean) {
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


            (this.domNode.querySelector("button.green")! as HTMLElement).onclick = async () => {
                const user = {
                    FirstName: (this.domNode.querySelector('input[name="FirstName"]')! as HTMLInputElement).value,
                    LastName: (this.domNode.querySelector('input[name="LastName"]')! as HTMLInputElement).value,
                    EmailAddress: (this.domNode.querySelector('input[name="EmailAddress"]')! as HTMLInputElement).value,
                    Password: (this.domNode.querySelector('input[name="Password"]')! as HTMLInputElement).value,
                };

                let good = false;
                for (const key in user) {
                    const node = this.domNode.querySelector(`input[name="${key}"]`);

                    if (node == null)
                        continue;

                    if ((node as HTMLInputElement).value?.trim()) {
                        good = true;
                    }
                }

                if (good) {
                    console.log(await ajaxJson(`/User/${this.user.UserID}`, "PATCH", user));
                    await renderRows();
                }
            };

            (this.domNode.querySelector("button.red")! as HTMLElement).onclick = () => {
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


            (this.domNode.querySelector("button.green")! as HTMLElement).onclick = () => {
                this.editing = true;
            };

            const func = () => {
                const bg = this.domNode.querySelector("button.green")! as HTMLElement;
                const br = this.domNode.querySelector("button.red")! as HTMLElement;

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
                }
            };

            (this.domNode.querySelector("button.red")! as HTMLElement).onclick = func;
        }
    }
}

const getUsers = () => new Promise<User[]>(async (resolve, reject) => {
    resolve(await ajax("/Users", "GET"));
});

const renderRows = async () => {
    const rc = query("#users > tbody");
    [...rc.children].filter(x => x.id !== "new-user").forEach(c => rc.removeChild(c));


    for (const u of await getUsers()) {
        const newRow = new Row(u);
        byId("new-user").parentElement!.insertBefore(newRow.node, byId("new-user"));
    }
}

(byId("new-user").querySelector("button.green") as HTMLButtonElement).onclick = async () => {
    const row = byId("new-user");
    const user = {
        UserID: (row.querySelector('input[name="UserID"]')! as HTMLInputElement).value,
        FirstName: (row.querySelector('input[name="FirstName"]')! as HTMLInputElement).value,
        LastName: (row.querySelector('input[name="LastName"]')! as HTMLInputElement).value,
        EmailAddress: (row.querySelector('input[name="EmailAddress"]')! as HTMLInputElement).value,
        Password: (row.querySelector('input[name="Password"]')! as HTMLInputElement).value,
    };

    let good = true;
    for (const key in user) {
        const node = row.querySelector(`input[name="${key}"]`);

        if (node == null)
            continue;

        if (!(node as HTMLInputElement).value?.trim()) {
            flash(node as HTMLInputElement);
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

