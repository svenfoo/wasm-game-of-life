mod utils;

use std::convert;
use std::fmt;
use std::mem;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }

    fn set_alive(&mut self) -> bool {
        Cell::Dead == mem::replace(self, Self::Alive)
    }
}

impl convert::From<bool> for Cell {
    fn from(v: bool) -> Self {
        match v {
            true => Cell::Alive,
            false => Cell::Dead,
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq)]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

impl Universe {
    fn get_index(&self, row: u32, column: u32) -> usize {
        assert!(row < self.height, "row out of bounds");
        assert!(column < self.width, "column out of bounds");
        (row * self.width + column) as usize
    }

    fn get_cell(&self, row: u32, column: u32) -> &Cell {
        let index = self.get_index(row, column);
        &self.cells[index]
    }

    // returns 1 if the cell is alive, 0 otherwise
    fn get_cell_value(&self, row: u32, column: u32) -> u8 {
        let cell = self.get_cell(row, column);
        *cell as u8
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let north = if row == 0 { self.height - 1 } else { row - 1 };
        let south = if row == self.height - 1 { 0 } else { row + 1 };
        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };
        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        self.get_cell_value(north, west) + self.get_cell_value(north, column) +
            self.get_cell_value(north, east) + self.get_cell_value(row, west) +
            self.get_cell_value(row, east) + self.get_cell_value(south, west) +
            self.get_cell_value(south, column) + self.get_cell_value(south, east)
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == Cell::Dead { '◻' } else { '◼' };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}

/// Methods added for tests
impl Universe {
    /// Set cells to be alive in a universe by passing the row and column
    /// of each cell as an array.
    pub fn set_cells_alive(&mut self, cells: &[(u32, u32)]) {
        for (row, col) in cells.iter() {
            let idx = self.get_index(*row, *col);
            self.cells[idx] = Cell::Alive;
        }
    }

    pub fn is_cell_alive(&self, row: u32, col: u32) -> bool {
        let idx = self.get_index(row, col);
        self.cells[idx] == Cell::Alive
    }
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    pub fn new(width: u32, height: u32) -> Universe {
        utils::set_panic_hook();

        assert!(width > 0);
        assert!(height > 0);

        let cells = vec![Cell::Dead; width as usize * height as usize];

        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                next[idx] = next_cell;
            }
        }

        self.cells = next;
    }

    pub fn render(&self) -> String {
        self.to_string()
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells[idx].toggle();
    }

    pub fn set_cell_alive(&mut self, row: u32, column: u32) -> bool {
        let idx = self.get_index(row, column);
        self.cells[idx].set_alive()
    }

    fn populate<F, C>(&mut self, f: F)
    where
        F: Fn(usize) -> C,
        C: Into<Cell>,
    {
        for (i, c) in self.cells.iter_mut().enumerate() {
            *c = f(i).into();
        }
    }

    pub fn clear(&mut self) {
        self.populate(|_| Cell::Dead);
    }

    pub fn initialize(&mut self) {
        self.populate(|i| i % 2 == 0 || i % 7 == 0);
    }
}

#[cfg(test)]
mod tests {
    use super::Universe;

    #[test]
    pub fn test_get_index() {
        let universe = Universe::new(3, 4);
        assert_eq!(universe.get_index(0, 0), 0);
        assert_eq!(universe.get_index(1, 1), 4);
        assert_eq!(universe.get_index(1, 2), 5);
        assert_eq!(universe.get_index(3, 2), 11);
    }

    #[test]
    #[should_panic(expected = "row out of bounds")]
    pub fn test_row_out_of_bounds() {
        let universe = Universe::new(6, 6);
        universe.get_index(6, 1);
    }

    #[test]
    #[should_panic(expected = "column out of bounds")]
    pub fn test_column_out_of_bounds() {
        let universe = Universe::new(6, 6);
        universe.get_index(1, 6);
    }
}
