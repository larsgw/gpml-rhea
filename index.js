import gpml2pvjson from 'gpml2pvjson/es5/index.js'
import fs from 'fs'
import util from 'util'
import fetch from 'node-fetch'

const { GPML2013aToPVJSON: parseGpml } = gpml2pvjson

function promisifyStream (stream) {
  return new Promise(function(resolve, reject) {
    stream.last().each(resolve)
    stream.on('error', () => reject())
  })
}

;(async function main (file = '-') {
  let input
  if (file !== '-' && fs.existsSync(file)) {
    input = fs.createReadStream(file, { encoding: 'utf8' })
  } else {
    input = process.stdin
  }

  const pvjson = await promisifyStream(parseGpml(input))
  const { pathway, entitiesById: entities } = pvjson

  // List interactions
  const interactions = pathway.contains
    .map(id => entities[id])
    .filter(element => element.gpmlElementName === 'Interaction' && !element.xrefDataSource)

  // Link attached interactions to anchors
  for (const interaction of interactions) {
    for (const point of interaction.points) {
      if (!point.isAttachedTo) { continue }

      const attachment = entities[point.isAttachedTo]
      if (attachment.gpmlElementName !== 'Anchor') { continue }

      interaction.isAttachedToAnchor = true
      if (!attachment.attachements) { attachment.attachements = [] }
      attachment.attachements.push(interaction.id)
    }
  }

  // Process main interactions (e.g. not those linked to an anchor)
  for (const interaction of interactions) {
    if (interaction.isAttachedToAnchor) { continue }

    const reactants = []

    // Get left and right reactants from the main ends of the line
    if (interaction.markerEnd === 'MimConversion') {
      reactants.push(
        { side: 'left', id: interaction.isAttachedTo[0] },
        { side: 'right', id: interaction.isAttachedTo[1] }
      )
    } else if (interaction.markerStart === 'MimConversion') {
      reactants.push(
        { side: 'right', id: interaction.isAttachedTo[0] },
        { side: 'left', id: interaction.isAttachedTo[1] }
      )
    } else {
      continue
    }

    // Loop over anchor to check for other reactants and catalysts
    for (const anchorId of interaction.burrs) {
      const anchor = entities[anchorId]
      for (const attachmentId of anchor.attachements) {
        const attachment = entities[attachmentId]
        if (!attachment.markerEnd && !attachment.markerStart) {
          reactants.push({
            side: 'left',
            id: attachment.isAttachedTo.find(id => id !== interaction.id)
          })
        } else if (attachment.markerEnd === 'MimConversion') {
          reactants.push({ side: 'right', id: attachment.isAttachedTo[1] })
        } else if (attachment.markerStart === 'MimConversion') {
          reactants.push({ side: 'right', id: attachment.isAttachedTo[0] })
        } else if (attachment.markerEnd === 'MimCatalysis') {
          reactants.push({ side: 'catalysis', id: attachment.isAttachedTo[0] })
        } else if (attachment.markerStart === 'MimCatalysis') {
          reactants.push({ side: 'catalysis', id: attachment.isAttachedTo[1] })
        }
      }
    }

    const reaction = {
      id: interaction.id,
      reactants: reactants
        // Fetch entities
        .map(({ id, side }) => ({ side, reactant: entities[id] }))
        // Flatten protein complexes (and other groups)
        .flatMap(({ side, reactant }) => reactant.contains
          ? reactant.contains.map(id => ({ side, reactant: entities[id] }))
          : { side, reactant })
        // Filter for data nodes (no lines, labels, etc.) and ensure everything has
        // a ChEBI (or is a protein)
        .filter(({ side, reactant }) => reactant.gpmlElementName === 'DataNode' &&
          (side === 'catalysis' || reactant.xrefDataSource === 'ChEBI'))
        // Select the needed data
        .map(({
          side,
          reactant: { textContent, xrefIdentifier }
        }) => ({
          side,
          reactant: { name: textContent, id: xrefIdentifier }
        }))
        // Group reactants
        .reduce(
          (sides, { side, reactant }) => (sides[side].push(reactant), sides),
          { left: [], right: [], catalysis: [] }
        )
    }

//     console.log(util.inspect(reaction, { colors: true, depth: 3 }))
    console.log(
      reaction.id.padStart(10, ' ') + ':',
      reaction.reactants.left.map(reactant => reactant.name).join(' + '),
      '→',
      reaction.reactants.right.map(reactant => reactant.name).join(' + ')
    )

    // Generate SPARQL query
    const compoundsLeft = reaction.reactants.left
      .map(reactant => `?reactionSide1 rh:contains/rh:compound/rh:chebi ch:CHEBI_${reactant.id.slice(6)} .`)
      .join('\n  ')
    const compoundsRight = reaction.reactants.right
      .map(reactant => `?reactionSide2 rh:contains/rh:compound/rh:chebi ch:CHEBI_${reactant.id.slice(6)} .`)
      .join('\n  ')
    const query = `PREFIX rh:<http://rdf.rhea-db.org/>
PREFIX ch:<http://purl.obolibrary.org/obo/>

SELECT DISTINCT ?reaction ?reactionEquation WHERE {
  ?reaction rdfs:subClassOf rh:Reaction .
  ?reaction rh:status rh:Approved .
  ?reaction rh:equation ?reactionEquation .
  ?reaction rh:side ?reactionSide .

  ?reaction rh:side ?reactionSide1 .
  ${compoundsLeft}

  ?reaction rh:side ?reactionSide2 .
  ${compoundsRight}

  ?reactionSide1 rh:transformableTo ?reactionSide2 .
}`.replace(/(\W)\s+(\S)/g, '$1$2').replace(/(\S)\s+(\W)/g, '$1$2').replace(/\s+/, ' ')

    const url = `https://sparql.rhea-db.org/sparql?query=${encodeURIComponent(query)}&format=application%2Fjson`
    const resp = await (await fetch(url)).json()

    console.log('---------------------------------------------')
    console.log(`Rhea: ${resp.results.bindings.length} results`)

    for (const result of resp.results.bindings) {
      const id = result.reaction.value.slice(23).padStart(10, ' ')
      console.log(`${id}: ${result.reactionEquation.value}`)
    }

    console.log('---------------------------------------------')
    console.log()
  }
})(...process.argv.slice(2)).catch(e => {
  console.error(e)
  process.exit(1)
})
