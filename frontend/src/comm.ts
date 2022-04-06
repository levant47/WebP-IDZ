export const fetchBackend = (path: string, method: string = "GET", body: {} = undefined) =>
    fetch(path, {
        method,
        body: JSON.stringify(body),
        headers: {"Content-Type": "application/json"},
    })
        .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
        .then(responseText => {
            return responseText !== "" ? JSON.parse(responseText) : undefined
        })
        .catch(error => {
            alert("An error occured!")
            return Promise.reject(error);
        });
