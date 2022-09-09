use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn read_snpm_file(path: &str) -> String {
    let contents = std::fs::read_to_string(path).expect("Something went wrong reading the file");
    // Return the contents as json
    return contents;
}
