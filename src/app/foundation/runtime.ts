import { AccountsController } from "../../modules/accounts/accounts.controller";
import { AccountsRepository } from "../../modules/accounts/accounts.repository";
import { AccountsService } from "../../modules/accounts/accounts.service";
import { CardsController } from "../../modules/cards/cards.controller";
import { CardsRepository } from "../../modules/cards/cards.repository";
import { CardsService } from "../../modules/cards/cards.service";
import { CategoriesController } from "../../modules/categories/categories.controller";
import { CategoriesRepository } from "../../modules/categories/categories.repository";
import { CategoriesService } from "../../modules/categories/categories.service";

const accountsRepository = new AccountsRepository();
const cardsRepository = new CardsRepository();
const categoriesRepository = new CategoriesRepository();

export const accountsController = new AccountsController(new AccountsService(accountsRepository));
export const cardsController = new CardsController(new CardsService(cardsRepository));
export const categoriesController = new CategoriesController(new CategoriesService(categoriesRepository));
