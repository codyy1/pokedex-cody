const pokemonGrid = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentPage = document.getElementById('currentPage');

let currentPageNumber = 1;
const pokemonsPerPage = 20;

// Type colors for Pokemon types
const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
};

async function fetchPokemons(page) {
    const offset = (page - 1) * pokemonsPerPage;
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${pokemonsPerPage}&offset=${offset}`);
    const data = await response.json();
    return Promise.all(data.results.map(pokemon => fetchPokemonDetails(pokemon.url)));
}

async function fetchPokemonDetails(url) {
    const response = await fetch(url);
    return await response.json();
}

function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    
    // Fallback image handling
    const pokemonImage = pokemon.sprites.front_default || 
                        pokemon.sprites.other['official-artwork'].front_default ||
                        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
    
    const types = pokemon.types.map(type => {
        return `<span class="type-badge ${type.type.name}">
                    <i class="fas ${getTypeIcon(type.type.name)}"></i>
                    ${type.type.name}
                </span>`;
    }).join('');

    card.innerHTML = `
        <div class="pokemon-header">
            <h2 class="pokemon-name">${pokemon.name}</h2>
            <span class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</span>
        </div>
        <div class="pokemon-image">
            <img src="${pokemonImage}" alt="${pokemon.name}" 
                 onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
        </div>
        <div class="pokemon-types">
            ${types}
        </div>
        <div class="pokemon-stats">
            <div class="stat">
                <span>Height: ${pokemon.height/10}m</span>
            </div>
            <div class="stat">
                <span>Weight: ${pokemon.weight/10}kg</span>
            </div>
            <div class="abilities">
                ${pokemon.abilities.map(ability => `
                    <span class="ability-tag">
                        ${ability.ability.name}
                        ${ability.is_hidden ? '<small>(Hidden)</small>' : ''}
                    </span>
                `).join('')}
            </div>
        </div>
    `;

    card.addEventListener('click', () => showPokemonDetails(pokemon));
    return card;
}

// Helper function to get type icons
function getTypeIcon(type) {
    const typeIcons = {
        normal: 'fa-circle',
        fire: 'fa-fire',
        water: 'fa-water',
        electric: 'fa-bolt',
        grass: 'fa-leaf',
        ice: 'fa-snowflake',
        fighting: 'fa-hand-fist',
        poison: 'fa-skull',
        ground: 'fa-mountain',
        flying: 'fa-wind',
        psychic: 'fa-brain',
        bug: 'fa-bug',
        rock: 'fa-gem',
        ghost: 'fa-ghost',
        dragon: 'fa-dragon',
        dark: 'fa-moon',
        steel: 'fa-shield',
        fairy: 'fa-wand-sparkles'
    };
    
    return typeIcons[type] || 'fa-circle';
}

async function showPokemonDetails(pokemon) {
    const modal = document.getElementById('pokemonModal');
    const modalContent = document.getElementById('modalContent');
    
    // Fetch additional details
    const [speciesData, evolutionData] = await Promise.all([
        fetch(pokemon.species.url).then(res => res.json()),
        fetch(pokemon.species.url)
            .then(res => res.json())
            .then(data => fetch(data.evolution_chain.url))
            .then(res => res.json())
    ]);

    // Get English description
    const description = speciesData.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text
        .replace(/\f/g, ' ') || 'No description available';

    // Format stats with progress bars
    const stats = pokemon.stats.map(stat => `
        <div class="stat-item">
            <span class="stat-label">${stat.stat.name.replace('-', ' ')}</span>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${(stat.base_stat / 255) * 100}%">
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Format abilities
    const abilities = pokemon.abilities.map(ability => `
        <div class="ability-item">
            <span class="ability-name">${ability.ability.name}</span>
            ${ability.is_hidden ? '<span class="hidden-ability">(Hidden)</span>' : ''}
        </div>
    `).join('');

    // Format moves
    const moves = pokemon.moves.map(move => `
        <span class="move-tag">${move.move.name}</span>
    `).join('');

    // Get evolution chain
    function getEvolutionChain(chain) {
        const evolutions = [];
        let current = chain;

        while (current) {
            evolutions.push({
                name: current.species.name,
                min_level: current.evolution_details[0]?.min_level || null
            });
            current = current.evolves_to[0];
        }
        return evolutions;
    }

    const evolutionChain = getEvolutionChain(evolutionData.chain);
    const evolutionHTML = evolutionChain.map((evo, index) => `
        <div class="evolution-item">
            <span class="evo-name">${evo.name}</span>
            ${evo.min_level ? `<span class="evo-level">Lv. ${evo.min_level}</span>` : ''}
            ${index < evolutionChain.length - 1 ? '<i class="fas fa-arrow-right"></i>' : ''}
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div class="pokemon-modal-content">
            <div class="modal-header">
                <h2>${pokemon.name.toUpperCase()} #${pokemon.id.toString().padStart(3, '0')}</h2>
                <div class="pokemon-types">
                    ${pokemon.types.map(type => 
                        `<span class="type-badge ${type.type.name}">${type.type.name}</span>`
                    ).join('')}
                </div>
            </div>

            <div class="modal-body">
                <div class="pokemon-images">
                    <img src="${pokemon.sprites.front_default}" alt="Front view">
                    <img src="${pokemon.sprites.back_default}" alt="Back view">
                    ${pokemon.sprites.front_shiny ? 
                        `<img src="${pokemon.sprites.front_shiny}" alt="Shiny front">` : ''}
                    ${pokemon.sprites.back_shiny ? 
                        `<img src="${pokemon.sprites.back_shiny}" alt="Shiny back">` : ''}
                </div>

                <div class="pokemon-description">
                    <h3>Description</h3>
                    <p>${description}</p>
                </div>

                <div class="pokemon-info-grid">
                    <div class="info-section">
                        <h3>Base Stats</h3>
                        <div class="stats-container">${stats}</div>
                    </div>

                    <div class="info-section">
                        <h3>Physical Traits</h3>
                        <p>Height: ${pokemon.height/10}m</p>
                        <p>Weight: ${pokemon.weight/10}kg</p>
                    </div>

                    <div class="info-section">
                        <h3>Abilities</h3>
                        <div class="abilities-container">${abilities}</div>
                    </div>

                    <div class="info-section">
                        <h3>Evolution Chain</h3>
                        <div class="evolution-chain">${evolutionHTML}</div>
                    </div>
                </div>

                <div class="moves-section">
                    <h3>Moves</h3>
                    <div class="moves-container">${moves}</div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal when clicking the close button or outside the modal
document.querySelector('.close-button').addEventListener('click', () => {
    document.getElementById('pokemonModal').style.display = 'none';
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('pokemonModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

async function displayPokemons(page) {
    pokemonGrid.innerHTML = '';
    const pokemons = await fetchPokemons(page);
    pokemons.forEach(pokemon => {
        pokemonGrid.appendChild(createPokemonCard(pokemon));
    });
    currentPage.textContent = page;
}

// Event Listeners
prevBtn.addEventListener('click', () => {
    if (currentPageNumber > 1) {
        currentPageNumber--;
        displayPokemons(currentPageNumber);
    }
});

nextBtn.addEventListener('click', () => {
    currentPageNumber++;
    displayPokemons(currentPageNumber);
});

searchInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length > 0) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);
            if (response.ok) {
                const pokemon = await response.json();
                pokemonGrid.innerHTML = '';
                pokemonGrid.appendChild(createPokemonCard(pokemon));
            }
        } catch (error) {
            pokemonGrid.innerHTML = '<p>No Pokemon found</p>';
        }
    } else {
        displayPokemons(currentPageNumber);
    }
});

// Initial load
displayPokemons(currentPageNumber);
