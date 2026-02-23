//init node server
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");


const app = express();
const port = 3000;

const categories = [
  {
    id: 1,
    titre: "A",
    images: [
      "https://blog.hellofresh.co.uk/wp-content/uploads/2021/03/HF201125_R209_W02_FR_RFR20161819-1_MB_Main_low-scaled.jpg",
      "https://kissmychef.com/wp-content/uploads/2020/07/cornetteria.jpg",
    ],
  },
  { id: 2, titre: "B2", images: [] },
  {
    id: 3,
    titre: "C",
    images: [
      "https://img-3.journaldesfemmes.fr/BNubGw2ChgpFyw3eK2g-PMwF28Y=/1240x/smart/7231e1a7ad4a4fbb94f3498c11392d23/ccmcms-jdf/36619834.jpg",
    ],
  },
  { id: 4, titre: "D", images: [] },
];

app.use(cors());
app.use(bodyParser.json());

app.get("/categories", (req, res) => {
  res.json(categories);
});

//ajouter une nouvelle image à une catégorie
app.post("/image", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ message: "L'URL de l'image est obligatoire" });
  }

  try {
    const urlImage = new URL(url);

    if (urlImage.protocol !== "http:" && urlImage.protocol !== "https:") {
      return res
        .status(400)
        .json({ message: "L'URL de l'image doit être en http / https" });
    }
  } catch {
    return res.status(400).json({ message: "L'URL de l'image est mal formée" });
  }

  //on vérifie que l'url n'est pas déjà présente dans les catégories
  // const urlDejaPresente = categories.some((cat) =>
  //   cat.images.some((img) => img === url),
  // );

  for(let categorie of categories) {
    for (let image of categorie.images) {
      if(image === url) {
        return res
          .status(409)
          .json({ message: "L'URL existe déjà" });
      }
    }
  }


  //a remplacer par une requete insert dans une BDD
  categories[0].images.push(url);

  res.status(201).json({ message: "Image ajoutée avec succès" });
});

//deplacement d'une image entre catégories
app.patch("/image/:idCategorie", (req, res) => {
  const idCategorie = parseInt(req.params.idCategorie);

  const { indexImage, monter } = req.body;

  if (monter == null || indexImage == null) {
    return res.status(400).json({ message: "Informations obligatoires" });
  }

  const indexCategorieOrigine = categories.findIndex(
    (cat) => cat.id === idCategorie,
  );

  if (indexCategorieOrigine === -1) {
    return res.status(404).json({ message: "Catégorie non trouvée" });
  }

  const categorie = categories[indexCategorieOrigine];

  console.log(idCategorie, categories);

  const urlImageAdeplacer = categorie.images[indexImage];

  const indexCategorieDestination = indexCategorieOrigine + (monter ? -1 : 1);

  //on copie l'image dans la categorie du dessous/dessus
  categories[indexCategorieDestination].images.push(urlImageAdeplacer);

  //on supprime l'image de la categorie actuelle
  categorie.images.splice(indexImage, 1);

  res.json({ message: "Image déplacée avec succès" });
});

app.delete("/image/:idCategorie", (req, res) => {
  const idCategorie = parseInt(req.params.idCategorie);

  const { indexImage } = req.body;

  if (indexImage == null) {
    return res.status(400).json({ message: "Informations obligatoires" });
  }

  const categorie = categories.find((cat) => cat.id === idCategorie);

  if (!categorie) {
    return res.status(404).json({ message: "Catégorie non trouvée" });
  }

  //on supprime l'image de la categorie actuelle
  categorie.images.splice(indexImage, 1);

  res.json({ message: "Image supprimée avec succès" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
