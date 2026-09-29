// Auto-generated VGI Canteen Menu Data
export const categoriesData = [
  {
    "id": "cat_1",
    "name": "Meals & Combos",
    "description": "Complete meals, thalis, and special combos",
    "sortOrder": 1,
    "active": true
  },
  {
    "id": "cat_2",
    "name": "Parathas (2 Pcs)",
    "description": "Fresh tawa parathas served with butter and pickle",
    "sortOrder": 2,
    "active": true
  },
  {
    "id": "cat_3",
    "name": "Snacks & Momos",
    "description": "Steamed & fried momos, fries, samosas, and pakoras",
    "sortOrder": 3,
    "active": true
  },
  {
    "id": "cat_4",
    "name": "Noodles & Chinese",
    "description": "Chowmein, hakka noodles, chilli potato, and Chinese specials",
    "sortOrder": 4,
    "active": true
  },
  {
    "id": "cat_5",
    "name": "Rice & Pasta",
    "description": "Fried rice and creamy white sauce pasta",
    "sortOrder": 5,
    "active": true
  },
  {
    "id": "cat_6",
    "name": "Burgers, Sandwiches & Rolls",
    "description": "Burgers, grilled sandwiches, and kathi rolls",
    "sortOrder": 6,
    "active": true
  },
  {
    "id": "cat_7",
    "name": "Juice Corner & Shakes",
    "description": "Fresh fruit juices, shakes, cold coffee, and fresh coconut",
    "sortOrder": 7,
    "active": true
  },
  {
    "id": "cat_8",
    "name": "Sweets & Bakery",
    "description": "Gulab jamun, gujiya, warm gajar halwa, and cakes",
    "sortOrder": 8,
    "active": true
  }
];

export const menuItemsData = [
  {
    "id": "item_1",
    "categoryId": "cat_1",
    "category": "Meals & Combos",
    "name": "Veg Thali",
    "description": "Wholesome student meal with dal tadka, seasonal sabzi, 4 butter rotis, steamed rice, salad, and pickle.",
    "price": 100,
    "imageUrl": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 12,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": []
  },
  {
    "id": "item_2",
    "categoryId": "cat_1",
    "category": "Meals & Combos",
    "name": "Chole Bhature",
    "description": "Two fluffy piping-hot golden bhaturas served with spicy spiced chickpeas, pickled onions, and green chilies.",
    "price": 60,
    "imageUrl": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 10,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": [
      {
        "id": "og_2",
        "name": "Add-ons",
        "selectionType": "MULTIPLE",
        "required": false,
        "options": [
          {
            "id": "opt_2_1",
            "name": "Extra Bhatura (1 pc)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_3",
    "categoryId": "cat_1",
    "category": "Meals & Combos",
    "name": "Fry Rice",
    "description": "Loaded wok-tossed vegetable fried rice with fresh spices and herbs.",
    "price": 120,
    "imageUrl": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 10,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_3",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_3_1",
            "name": "Half Plate (₹120)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_3_2",
            "name": "Full Plate (₹150)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_4",
    "categoryId": "cat_2",
    "category": "Parathas (2 Pcs)",
    "name": "Aloo Paratha",
    "description": "Two crisp golden tawa parathas stuffed with seasoned spiced potato filling, served with butter & pickle (2 Pcs).",
    "price": 60,
    "imageUrl": "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_5",
    "categoryId": "cat_2",
    "category": "Parathas (2 Pcs)",
    "name": "Aloo Pyaj Paratha",
    "description": "Two golden parathas packed with spiced potato and crunchy onion filling, served with butter & pickle (2 Pcs).",
    "price": 70,
    "imageUrl": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_6",
    "categoryId": "cat_2",
    "category": "Parathas (2 Pcs)",
    "name": "Paneer Paratha",
    "description": "Two rich tawa parathas stuffed with fresh seasoned spiced paneer, served with butter & pickle (2 Pcs).",
    "price": 90,
    "imageUrl": "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 10,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": []
  },
  {
    "id": "item_7",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Steam Momos",
    "description": "Steamed dumplings filled with savory minced vegetables, served with red spicy sauce and mayonnaise.",
    "price": 40,
    "imageUrl": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_7",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_7_1",
            "name": "Half (₹40)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_7_2",
            "name": "Full (₹70)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_8",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Fried Momos",
    "description": "Crisp golden fried dumplings with vegetable filling, served with spicy garlic sauce & mayonnaise.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_8",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_8_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_8_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_9",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Spring Roll",
    "description": "Crunchy golden pastry rolls stuffed with shredded vegetables and noodles (1 Plate).",
    "price": 60,
    "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_10",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "French Fries",
    "description": "Crispy salted potato fries served hot with tomato ketchup.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_10",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_10_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_10_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_11",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Samosa",
    "description": "Crispy flaky crust pastry filled with spiced potato and green peas (1 Pc).",
    "price": 15,
    "imageUrl": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 2,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_12",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Bread Pakora",
    "description": "Spiced potato sandwich battered in gram flour and fried golden (1 Pc).",
    "price": 20,
    "imageUrl": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 3,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_13",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Paneer Bread Pakora",
    "description": "Crispy bread pakora stuffed with thick slice of paneer and seasoned potatoes (1 Pc).",
    "price": 30,
    "imageUrl": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 4,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_14",
    "categoryId": "cat_3",
    "category": "Snacks & Momos",
    "name": "Omelette",
    "description": "Fresh egg omelette prepared with onions, green chilies, and toast.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_14",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_14_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_14_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_15",
    "categoryId": "cat_4",
    "category": "Noodles & Chinese",
    "name": "Chowmein",
    "description": "Stir fried noodles tossed with shredded cabbage, carrots, capsicum, and oriental sauces.",
    "price": 40,
    "imageUrl": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 7,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_15",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_15_1",
            "name": "Half (₹40)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_15_2",
            "name": "Full (₹70)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_16",
    "categoryId": "cat_4",
    "category": "Noodles & Chinese",
    "name": "Hakka Noodles",
    "description": "Wok tossed noodles prepared with crunchy bell peppers, garlic, and spring onions.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_16",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_16_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_16_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_17",
    "categoryId": "cat_4",
    "category": "Noodles & Chinese",
    "name": "Mushroom Noodles",
    "description": "Savory stir fried noodles loaded with tender button mushrooms and herbs.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_17",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_17_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_17_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_18",
    "categoryId": "cat_4",
    "category": "Noodles & Chinese",
    "name": "Chilli Potato",
    "description": "Crispy fried potato fingers tossed in spicy chili garlic sauce with capsicum and onions.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 7,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_18",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_18_1",
            "name": "Half (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_18_2",
            "name": "Full (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_19",
    "categoryId": "cat_4",
    "category": "Noodles & Chinese",
    "name": "Honey Chilli Potato",
    "description": "Crispy potato fingers tossed in sweet honey and spicy chili sauce with sesame seeds.",
    "price": 70,
    "imageUrl": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": [
      {
        "id": "og_19",
        "name": "Portion Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_19_1",
            "name": "Half (₹70)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_19_2",
            "name": "Full (₹100)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_20",
    "categoryId": "cat_5",
    "category": "Rice & Pasta",
    "name": "Veg Fried Rice",
    "description": "Wok tossed basmati rice with freshly chopped garden vegetables and soy sauce (1 Plate).",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_21",
    "categoryId": "cat_5",
    "category": "Rice & Pasta",
    "name": "White Sauce Pasta",
    "description": "Creamy penne pasta cooked in rich cheesy béchamel sauce with sweet corn and herbs (1 Plate).",
    "price": 90,
    "imageUrl": "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 10,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": []
  },
  {
    "id": "item_22",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Plain Burger",
    "description": "Crispy spiced vegetable patty in toasted burger bun with onion, tomato, and mayo (1 Pc).",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_23",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Paneer Burger",
    "description": "Thick spiced paneer patty with lettuce and burger sauce in toasted bun (1 Pc).",
    "price": 70,
    "imageUrl": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_24",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Cheese Burger",
    "description": "Veggie patty burger topped with melted cheese slice and caramelized onions (1 Pc).",
    "price": 80,
    "imageUrl": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": []
  },
  {
    "id": "item_25",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Veg Sandwich",
    "description": "Fresh sandwich layered with cucumber, tomato, potato mash, and mint chutney.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 6,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_25",
        "name": "Preparation Style",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_25_1",
            "name": "Plain (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_25_2",
            "name": "Grilled (₹60)",
            "priceDelta": 10,
            "active": true
          },
          {
            "id": "opt_25_3",
            "name": "Cheese Grilled (₹70)",
            "priceDelta": 20,
            "active": true
          },
          {
            "id": "opt_25_4",
            "name": "Special Loaded Cheese (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_26",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Veg Roll",
    "description": "Layered paratha roll stuffed with spicy sautéed vegetables and mint chutney (1 Pc).",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 7,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_27",
    "categoryId": "cat_6",
    "category": "Burgers, Sandwiches & Rolls",
    "name": "Egg Roll",
    "description": "Layered paratha roasted with fresh egg, crunchy onions, and spicy green sauce (1 Pc).",
    "price": 70,
    "imageUrl": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 8,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_28",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Pomegranate Juice",
    "description": "100% fresh natural pomegranate (Anar) juice squeezed fresh to order.",
    "price": 90,
    "imageUrl": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 4,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": [
      {
        "id": "og_28",
        "name": "Serving Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_28_1",
            "name": "Regular Glass (₹90)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_28_2",
            "name": "Large Glass (₹120)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_29",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Mango Shake",
    "description": "Rich creamy mango shake prepared with sweet mango pulp and chilled milk.",
    "price": 60,
    "imageUrl": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 4,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_29",
        "name": "Serving Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_29_1",
            "name": "Small (₹60)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_29_2",
            "name": "Medium (₹70)",
            "priceDelta": 10,
            "active": true
          },
          {
            "id": "opt_29_3",
            "name": "Large (₹80)",
            "priceDelta": 20,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_30",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Banana Shake",
    "description": "Wholesome shake blended with fresh ripe bananas and cold creamy milk.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 4,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_30",
        "name": "Serving Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_30_1",
            "name": "Small (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_30_2",
            "name": "Medium (₹70)",
            "priceDelta": 20,
            "active": true
          },
          {
            "id": "opt_30_3",
            "name": "Large (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_31",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Sweet Lime Juice",
    "description": "Freshly squeezed sweet lime (Mosambi) juice served chilled.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 4,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": [
      {
        "id": "og_31",
        "name": "Serving Size",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_31_1",
            "name": "Small (₹50)",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_31_2",
            "name": "Medium (₹70)",
            "priceDelta": 20,
            "active": true
          },
          {
            "id": "opt_31_3",
            "name": "Large (₹80)",
            "priceDelta": 30,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_32",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Cold Coffee",
    "description": "Chilled creamy coffee blended with fine roasted coffee beans and chocolate syrup (1 Glass).",
    "price": 80,
    "imageUrl": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 5,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": []
  },
  {
    "id": "item_33",
    "categoryId": "cat_7",
    "category": "Juice Corner & Shakes",
    "name": "Coconut",
    "description": "Natural fresh sweet tender green coconut water served with straw (1 Whole Coconut).",
    "price": 80,
    "imageUrl": "https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 2,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_34",
    "categoryId": "cat_8",
    "category": "Sweets & Bakery",
    "name": "Gulab Jamun",
    "description": "Soft melt-in-mouth mawa dumplings soaked in warm cardamom sugar syrup (1 Pc).",
    "price": 15,
    "imageUrl": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 2,
    "isPopular": true,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_35",
    "categoryId": "cat_8",
    "category": "Sweets & Bakery",
    "name": "Gujiya",
    "description": "Crispy flaky deep-fried pastry filled with sweet mawa and dry fruits (1 Pc).",
    "price": 15,
    "imageUrl": "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 2,
    "isPopular": false,
    "isFeatured": false,
    "optionGroups": []
  },
  {
    "id": "item_36",
    "categoryId": "cat_8",
    "category": "Sweets & Bakery",
    "name": "Gajar Ka Halwa",
    "description": "Traditional slow-cooked red carrot halwa prepared with pure desi ghee and dry fruits (₹380 / Kg).",
    "price": 380,
    "imageUrl": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 3,
    "isPopular": true,
    "isFeatured": true,
    "optionGroups": [
      {
        "id": "og_36",
        "name": "Quantity Option",
        "selectionType": "SINGLE",
        "required": true,
        "options": [
          {
            "id": "opt_36_1",
            "name": "1 Bowl / 100g (₹50)",
            "priceDelta": -330,
            "active": true
          },
          {
            "id": "opt_36_2",
            "name": "250 gm (₹95)",
            "priceDelta": -285,
            "active": true
          },
          {
            "id": "opt_36_3",
            "name": "500 gm (₹190)",
            "priceDelta": -190,
            "active": true
          },
          {
            "id": "opt_36_4",
            "name": "1 Kg Box (₹380)",
            "priceDelta": 0,
            "active": true
          }
        ]
      }
    ]
  },
  {
    "id": "item_37",
    "categoryId": "cat_8",
    "category": "Sweets & Bakery",
    "name": "Cake",
    "description": "Fresh campus celebration cake with creamy frosting and decorative toppings (1 Kg).",
    "price": 350,
    "imageUrl": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    "active": true,
    "soldOut": false,
    "stockMode": "MANUAL",
    "stockQty": 100,
    "prepTime": 15,
    "isPopular": false,
    "isFeatured": true,
    "optionGroups": [
      {
        "id": "og_37",
        "name": "Flavor Choice",
        "selectionType": "SINGLE",
        "required": false,
        "options": [
          {
            "id": "opt_37_1",
            "name": "Chocolate Truffle",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_37_2",
            "name": "Black Forest",
            "priceDelta": 0,
            "active": true
          },
          {
            "id": "opt_37_3",
            "name": "Pineapple Cream",
            "priceDelta": 0,
            "active": true
          }
        ]
      }
    ]
  }
];
