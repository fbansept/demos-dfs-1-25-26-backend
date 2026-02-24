//init node server
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwtUtils = require("jsonwebtoken");
const jwtInterceptor = require("./jwt-interceptor");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const utilisateurs = [
  {
    email: "a@a.com",
    password: "root",
    admin: true,
    categories: [
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
    ],
  },
  {
    email: "b@b.com",
    password: "root",
    admin: false,
    categories: [],
  },
];

app.post("/inscription", (req, res) => {
  //TODO : valider les données + hacher le mot de passe + si l'email est unique

  const nouvelUtilisateur = req.body;

  //on force le droit de l'utilisateur à ne pas être un admin
  nouvelUtilisateur.admin = false;

  utilisateurs.push(nouvelUtilisateur);

  res.status(201).json({ message: "Utilisateur ajoutée avec succès" });
});

app.post("/connexion", (req, res) => {
  const utilisateur = req.body;

  //note : en cas de mot de passe hasher on devrait utiliser une methode comme bcrypt pour vérifier
  // la compatibilité du mot de passe en clair avec le mot de passe hashé
  if (
    utilisateurs.find(
      (u) =>
        u.email === utilisateur.email && u.password === utilisateur.password,
    )
  ) {
    const jwt = jwtUtils.sign({ sub: utilisateur.email }, "azerty");

    return res.json({ jwt });
  }

  return res.status(401).send();
});

app.get("/categories", jwtInterceptor, (req, res) => {
  const email = req.user.sub;
  const utilisateur = utilisateurs.find((u) => u.email === email);
  res.json(utilisateur.categories);
});

//ajouter une nouvelle image à une catégorie
app.post("/image", jwtInterceptor, (req, res) => {
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

  const email = req.user.sub;
  const utilisateur = utilisateurs.find((u) => u.email === email);
  const categories = utilisateur.categories;

  //on vérifie que l'url n'est pas déjà présente dans les catégories
  // const urlDejaPresente = categories.some((cat) =>
  //   cat.images.some((img) => img === url),
  // );

  for (let categorie of categories) {
    for (let image of categorie.images) {
      if (image === url) {
        return res.status(409).json({ message: "L'URL existe déjà" });
      }
    }
  }

  //a remplacer par une requete insert dans une BDD
  categories[0].images.push(url);

  res.status(201).json({ message: "Image ajoutée avec succès" });
});

//deplacement d'une image entre catégories
app.patch("/image/:idCategorie", jwtInterceptor, (req, res) => {
  const idCategorie = parseInt(req.params.idCategorie);

  const email = req.user.sub;
  const utilisateur = utilisateurs.find((u) => u.email === email);
  const categories = utilisateur.categories;  

  const { indexImage, monter } = req.body;

  if (monter == null || indexImage == null) {
    return res.status(400).json({ message: "Informations obligatoires" });
  }

  const indexCategorieOrigine = categories.findIndex(
    (cat) => cat.id === idCategorie,
  );

  if (indexCategorieOrigine === -1) {
    return res.status(403).json({ message: "Catégorie inaccessible" });
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

app.delete("/image/:idCategorie", jwtInterceptor, (req, res) => {
  const idCategorie = parseInt(req.params.idCategorie);

  const email = req.user.sub;
  const utilisateur = utilisateurs.find((u) => u.email === email);
  const categories = utilisateur.categories;

  const { indexImage } = req.body;

  if (indexImage == null) {
    return res.status(400).json({ message: "Informations obligatoires" });
  }

  const categorie = categories.find((cat) => cat.id === idCategorie);

  if (!categorie) {
    return res.status(403).json({ message: "Catégorie inaccessible" });
  }

  //on supprime l'image de la categorie actuelle
  categorie.images.splice(indexImage, 1);

  res.json({ message: "Image supprimée avec succès" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
