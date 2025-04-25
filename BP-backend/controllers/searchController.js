const db = require('../config/db');

const searchController = {
  async searchProducts(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Convert query to lowercase for case-insensitive search
      const searchTerm = q.toLowerCase().trim();
      console.log(`Searching for products with term: "${searchTerm}"`);

      // Split search term into words for better matching
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      console.log(`Search words: ${JSON.stringify(searchWords)}`);

      // If no valid search words, return empty result
      if (searchWords.length === 0) {
        return res.status(200).json({
          products: [],
          count: 0,
          query: q
        });
      }

      // This is the exact standalone term we're checking for
      const exactTerm = searchTerm;

      let query = `
        WITH search_results AS (
          SELECT
            id,
            name,
            price,
            image_url as "imageUrl",
            price_unit as "priceUnit",
            category,
            subcategory,
            lower(name) as lower_name,
            CASE
              -- Explicit check for exact match
              WHEN LOWER(name) = $1 THEN 100

              -- Most explicit check for standalone word
              WHEN (
                LOWER(name) ~ '^${exactTerm}[^a-z0-9]' OR   -- Starts with term followed by non-alphanumeric
                LOWER(name) ~ ' ${exactTerm}[^a-z0-9]' OR   -- Has space, then term, then non-alphanumeric
                LOWER(name) ~ '[^a-z0-9]${exactTerm} ' OR   -- Has non-alphanumeric, then term, then space
                LOWER(name) ~ '[^a-z0-9]${exactTerm}$' OR   -- Has non-alphanumeric, then term at end
                LOWER(name) ~ '^${exactTerm} ' OR           -- Starts with term then space
                LOWER(name) ~ ' ${exactTerm}$' OR           -- Has space then term at end
                LOWER(name) ~ '^${exactTerm}$'              -- Is exactly the term
              ) THEN 90

              -- Plain name contains
              WHEN LOWER(name) LIKE '%${exactTerm}%' THEN 70

              -- Other fields contain
              WHEN LOWER(category) LIKE '%${exactTerm}%' THEN 50
              WHEN LOWER(subcategory) LIKE '%${exactTerm}%' THEN 40

              -- Default
              ELSE 10
            END as score
          FROM
            products
          WHERE `;

      const queryParams = [exactTerm]; // First parameter is the exact term
      let paramIndex = 2;

      // Add conditions for each search word
      const wordConditions = searchWords.map(word => {
        if (word.length >= 1) {
          const wordCondition = `(
            LOWER(name) ILIKE $${paramIndex} OR
            LOWER(category) ILIKE $${paramIndex} OR
            LOWER(subcategory) ILIKE $${paramIndex}
          )`;
          queryParams.push(`%${word}%`);
          paramIndex++;
          return wordCondition;
        }
        return null;
      }).filter(Boolean);

      // If we have word conditions, add them to the query with OR instead of AND
      if (wordConditions.length > 0) {
        query += `(${wordConditions.join(' OR ')})`;
      } else {
        // Fall back to the original search
        query += `LOWER(name) ILIKE $2`;
        queryParams.push(`%${exactTerm}%`);
      }

      // Add a scoring system based on number of matching words
      query += `
        ),
        word_match_scoring AS (
          SELECT 
            id,
            name,
            price,
            "imageUrl",
            "priceUnit",
            category,
            subcategory,
            lower_name,
            score,
            (
      `;

      // Add scoring based on how many words match
      searchWords.forEach((word, idx) => {
        if (idx > 0) query += " + ";
        query += `CASE WHEN LOWER(name) ILIKE '%${word}%' THEN 10 
                 WHEN LOWER(category) ILIKE '%${word}%' THEN 5
                 WHEN LOWER(subcategory) ILIKE '%${word}%' THEN 3
                 ELSE 0 END`;
      });

      // Complete the query
      query += `
            ) as word_match_score
          FROM search_results
        )
        SELECT 
          id,
          name,
          price,
          "imageUrl",
          "priceUnit",
          category,
          subcategory,
          score + word_match_score as score,
          score + word_match_score as sort_rank,
          -- Create debug info column
          CASE
            WHEN lower_name ~ ' ${exactTerm} ' THEN 'MATCH: Surrounded by spaces'
            WHEN lower_name ~ '^${exactTerm} ' THEN 'MATCH: At start with space after'
            WHEN lower_name ~ ' ${exactTerm}$' THEN 'MATCH: At end with space before'
            WHEN lower_name ~ '${exactTerm}' THEN 'CONTAINS: As substring'
            ELSE 'NO MATCH'
          END as match_description
        FROM word_match_scoring
        ORDER BY (score + word_match_score) DESC, name ASC
      `;

      console.log('Executing query with params:', queryParams);

      // Execute the query with the parameters
      const result = await db.query(query, queryParams);
      console.log(`Found ${result.rows.length} products matching "${searchTerm}"`);

      if (result.rows.length > 0) {
        // Log the top 10 results with detailed info
        console.log("Top 10 results with scores and match info:");
        result.rows.slice(0, 10).forEach((row, idx) => {
          console.log(`${idx+1}. [Score: ${row.score}] [${row.match_description}] "${row.name}" (lower: "${row.lower_name}")`);
        });
      }

      // Important: Return the sort_rank in the response so frontend can use it
      const cleanResults = result.rows.map(row => {
        const { lower_name, match_description, ...cleanRow } = row;
        return cleanRow;
      });

      res.status(200).json({
        products: cleanResults,
        count: cleanResults.length,
        query: q
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Při vyhledávání došlo k chybě.' });
    }
  }
};

module.exports = searchController;
