# Système d'Évaluation avec Étoiles

## Composants disponibles

### 1. StarRating
Composant réutilisable pour afficher et gérer les étoiles de notation (1-5).

**Utilisation:**
```jsx
import StarRating from '../components/StarRating';

// Affichage simple
<StarRating rating={4} size="md" />

// Interactif
<StarRating
  rating={rating}
  size="lg"
  interactive={true}
  onChange={setRating}
  hoverRating={hover}
  onHover={setHover}
  onHoverEnd={() => setHover(0)}
/>
```

**Props:**
- `rating` (number): Note actuelle (1-5)
- `size` (string): Taille des étoiles ('sm', 'md', 'lg') - défaut: 'md'
- `interactive` (boolean): Permet l'interaction - défaut: false
- `onChange` (function): Callback quand une étoile est cliquée
- `hoverRating` (number): Note en survol (pour le preview)
- `onHover` (function): Callback au survol
- `onHoverEnd` (function): Callback fin de survol

---

### 2. RatingModal
Modal pour que les clients évaluent une prestation après paiement.

**Utilisation:**
```jsx
import RatingModal from '../components/RatingModal';

const [showRatingModal, setShowRatingModal] = useState(false);
const [selectedReservation, setSelectedReservation] = useState(null);

// Afficher le modal
<button onClick={() => {
  setSelectedReservation(reservation);
  setShowRatingModal(true);
}}>
  Évaluer
</button>

// Rendu
{showRatingModal && selectedReservation && (
  <RatingModal
    reservation={selectedReservation}
    onClose={() => setShowRatingModal(false)}
    onSuccess={() => {
      // Rafraîchir les données...
      fetchRatings();
    }}
  />
)}
```

**Props:**
- `reservation` (object): Objet réservation avec `_id`
- `onClose` (function): Callback pour fermer le modal
- `onSuccess` (function): Callback après succès de l'enregistrement

**Fonctionnalités:**
- Sélection interactive de 1-5 étoiles
- Champ de commentaire optionnel (max 500 caractères)
- Sauvegarde dans la collection `Rating`
- Toast de confirmation
- Dark mode support

---

### 3. RatingBadge
Composant pour afficher un badge avec la note (pour les listes, profils, etc.).

**Utilisation:**
```jsx
import RatingBadge from '../components/RatingBadge';

// Simple
<RatingBadge rating={4.5} />

// Avec compteur
<RatingBadge rating={4.2} count={23} />

// Petit format
<RatingBadge rating={4.5} size="sm" showText={false} />
```

**Props:**
- `rating` (number): Note (1-5)
- `count` (number): Nombre d'évaluations (optionnel)
- `size` (string): Taille des étoiles ('sm', 'md', 'lg') - défaut: 'md'
- `showText` (boolean): Afficher le texte de la note - défaut: true

---

### 4. ProviderRatingsDisplay
Composant pour afficher toutes les évaluations d'un prestataire.

**Utilisation:**
```jsx
import ProviderRatingsDisplay from '../components/ProviderRatingsDisplay';

<ProviderRatingsDisplay providerId={provider._id} />
```

**Fonctionnalités:**
- Affiche la note moyenne
- Liste toutes les évaluations avec les étoiles
- Affiche le nom du client, la date et le commentaire
- Gestion du chargement

---

## Flux complet d'évaluation

1. **Après paiement:** Le client peut cliquer sur "Évaluer le service"
2. **Modal:** RatingModal s'ouvre
3. **Sélection:** Client sélectionne 1-5 étoiles (avec preview au survol)
4. **Commentaire:** Optionnel, max 500 caractères
5. **Sauvegarde:** POST à `/api/ratings` avec:
   - `reservationId`: ID de la réservation
   - `rating`: 1-5
   - `comment`: texte optionnel
6. **Confirmation:** Toast de succès
7. **Affichage:** L'évaluation apparaît dans ProviderRatingsDisplay

---

## Styles Tailwind

Tous les composants utilisent **Tailwind CSS** exclusivement:
- ✅ Responsive
- ✅ Dark mode support
- ✅ Animations fluides
- ✅ Cohérent avec le design Velya
