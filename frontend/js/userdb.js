export class UserDatabase {
  constructor(dbName) {
    this.dbName = dbName;
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      if (this.dbName === "") {
        reject(new Error("Database name cannot be empty."));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("users")) {
          const store = db.createObjectStore("users", { keyPath: "email" });
          store.createIndex("username", "username", { unique: true });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(new Error(event.target.error));
      };
    });
  }

  async addUser(userData) {
    const existingUserByEmail = await this.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error("A user with this email already exists");
    }

    const existingUserByUsername = await this.getUserByUsername(
      userData.username
    );
    if (existingUserByUsername) {
      throw new Error("A user with this username already exists");
    }

    const db = await this.openDatabase();
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    const request = store.add(userData);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve("User added successfully!");
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to add user: ${event.target.error}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  }

  async getUserByEmail(email) {
    const db = await this.openDatabase();
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const request = store.get(email);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to retrieve user: ${event.target.error}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  }

  async getUserByUsername(username) {
    const db = await this.openDatabase();
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const index = store.index("username");
    const request = index.get(username);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to retrieve user: ${event.target.error}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  }

  async updateUser(userData) {
    const db = await this.openDatabase();
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    const request = store.put(userData);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve("User updated successfully!");
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to update user: ${event.target.error}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  }
}
