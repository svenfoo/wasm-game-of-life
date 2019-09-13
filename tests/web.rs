//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}

extern crate wasm_game_of_life;
use wasm_game_of_life::Universe;

#[cfg(test)]
pub fn input_spaceship() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells_alive(&[(1, 2), (2, 3), (3, 1), (3, 2), (3, 3)]);
    universe
}

#[cfg(test)]
pub fn expected_spaceship() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells_alive(&[(2, 1), (2, 3), (3, 2), (3, 3), (4, 2)]);
    universe
}

#[cfg(test)]
pub fn empty_universe() -> Universe {
    Universe::new(6, 6)
}

#[wasm_bindgen_test]
pub fn test_tick() {
    let mut universe = input_spaceship();
    let expected_universe = expected_spaceship();
    universe.tick();
    assert_eq!(&universe, &expected_universe);
}

#[wasm_bindgen_test]
pub fn test_clear() {
    let mut universe = input_spaceship();
    let expected_universe = empty_universe();
    universe.clear();
    assert_eq!(&universe, &expected_universe);
}

#[wasm_bindgen_test]
pub fn test_set_cell_alive() {
    let mut universe = empty_universe();
    // setting a dead cell alive set should return true
    assert!(universe.set_cell_alive(2, 1));
    assert!(universe.is_cell_alive(2, 1));
    // setting an alive cell should return false
    assert!(! universe.set_cell_alive(2, 1));
    assert!(universe.is_cell_alive(2, 1));
}
