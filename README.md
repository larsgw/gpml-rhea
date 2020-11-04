# GPML-Rhea

Collect chemical reactions from a GPML file and look for matching Rhea equations.

Pathway requirements:
  - MIM interactions compatible with https://github.com/BiGCAT-UM/WikiPathwaysInteractions/tree/master/FilesGPML#readme
  - Metabolites with ChEBI identifiers

## Install

System requirements:
  - [Node.js v14](https://nodejs.org/en/download/)
  - npm (usually comes with Node.js)

### Installing Node.js on Linux

    sudo apt-get install nodejs-dev node-gyp libssl1.0-dev
    sudo apt install npm

### Installing GPML-Rhea

    npm install --global @larsgw/gpml-rhea

Alternatively, run "without" installing:

    npx @larsgw/gpml-rhea [options]

## Usage

    GPML-Rhea
    
      gpml-rhea [file]             Read file
      gpml-rhea -                  Read from standard in
      gpml-rhea -v, --version      Get the version
      gpml-rhea -h, --help         Print this message

## Example

    > curl -L -o pathway.gpml https://webservice.wikipathways.org/getPathwayAs?fileType=gpml&pwId=WP5019&revision=113587
    > gpml-rhea pathway.gpml
    id192c7b4a: 5,10-Methenyltetrahydrofolate + NADH → 5,10-Methylenetetrahydrofolate + NAD(1-)
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    id4f3af248: Oxidised ferredoxin → Reduced ferredoxin
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    id59fbd0e3: 10-Formyltetrahydrofolate + dihydrogen → 5,10-Methenyltetrahydrofolate
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    id8e976caf: 5-Methyltetrahydrofolate → methyl + Tetrahydrofolate
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    idb70e2922: NAD(1-) → NADH
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    idcb0cc195: formate + ATP + Tetrahydrofolate → 10-Formyltetrahydrofolate + hydrogenphosphate + ADP
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    ide2e37f0: 5,10-Methylenetetrahydrofolate + NADH → 5-Methyltetrahydrofolate + NAD(1-)
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    ideb932d04: carbon monooxide + HSCoA + methyl → acetyl-CoA
    ---------------------------------------------
    Rhea: 0 results
    ---------------------------------------------

    idee9950c3: carbon dioxide + dihydrogen → formate + hydron
    ---------------------------------------------
    Rhea: 1 results
        27610: formate + H(+) = CO2 + H2
    ---------------------------------------------

    idf6f6d75: dihydrogen → hydron
    ---------------------------------------------
    Rhea: 13 results
        24636: H2 + NAD(+) = H(+) + NADH
        27610: formate + H(+) = CO2 + H2
        29047: a menaquinone + 2 H(+)(in) + H2 = a menaquinol + 2 H(+)(out)
        29051: 2 H(+)(in) + H2 + menaquinone-8 = 2 H(+)(out) + menaquinol-8
        29055: a ubiquinone + 2 H(+)(in) + H2 = a ubiquinol + 2 H(+)(out)
        29059: 2 H(+)(in) + H2 + ubiquinone-8 = 2 H(+)(out) + ubiquinol-8
        30279: 2 H2 + NAD(+) + 2 oxidized [2Fe-2S]-[ferredoxin] = 3 H(+) + NADH + 2 reduced [2Fe-2S]-[ferredoxin]
        35591: H2 + n sulfur = H(+) + hydrogen sulfide + (n-1) sulfur
        17445: H2 + 2 oxidized [2Fe-2S]-[ferredoxin] = 2 H(+) + 2 reduced [2Fe-2S]-[ferredoxin]
        18637: H2 + NADP(+) = H(+) + NADPH
        20017: 5,10-methenyl-5,6,7,8-tetrahydromethanopterin + H2 = 5,10-methylenetetrahydromethanopterin + H(+)
        20625: 2 [Fe(III)-cytochrome c3] + H2 = 2 [Fe(II)-cytochrome c3] + 2 H(+)
        55748: coenzyme B + coenzyme M + 2 H(+) + 2 reduced [2Fe-2S]-[ferredoxin] = coenzyme M-coenzyme B heterodisulfide + 2 H2 + 2 oxidized [2Fe-2S]-[ferredoxin]
    ---------------------------------------------
