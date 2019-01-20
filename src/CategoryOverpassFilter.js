const OverpassLayer = require('overpass-layer')
const tabs = require('modulekit-tabs')

const state = require('./state')
const Filter = require('overpass-frontend').Filter
const getPathFromJSON = require('./getPathFromJSON')

class CategoryOverpassFilter {
  constructor (master) {
    this.master = master
    this.data = this.master.data.filter

    this.tabFilter = new tabs.Tab({
      id: 'filter'
    })
    this.master.tools.add(this.tabFilter)

    this.tabFilter.header.innerHTML = '<i class="fa fa-filter" aria-hidden="true"></i>'
    this.tabFilter.header.title = lang('filter')

    this.domFilter = document.createElement('form')
    this.tabFilter.content.appendChild(this.domFilter)

    this.tabFilter.on('select', () => this.formFilter.resize())

    for (var k in this.data) {
      let f = this.data[k]
      if ('name' in f && typeof f.name === 'string') {
        global.currentCategory = this.master
        let t = OverpassLayer.twig.twig({ data: f.name, autoescape: true })
        f.name = t.render({}).toString()
      } else if (!('name' in f)) {
        f.name = lang('tag:' + k)
      }

      if ('values' in f) {
        let template = OverpassLayer.twig.twig({ data: f.valueName || '{{ value }}', autoescape: true })

        if (typeof f.values === 'string') {
          f.values = getPathFromJSON(f.values, this.master.data)
        }

        if (Array.isArray(f.values) && f.valueName) {
          let newValues = {}
          f.values.forEach(value => {
            newValues[value] = template.render({ value }).toString()
          })
          f.values = newValues
        } else if (typeof f.values === 'object') {
          for (var k1 in f.values) {
            if (typeof f.values[k1] === 'string') {
              let t = OverpassLayer.twig.twig({ data: f.values[k1], autoescape: true })
              f.values[k1] = t.render({}).toString()
            } else if (typeof f.values[k1] === 'object') {
              if (!('name' in f.values[k1])) {
                f.values[k1].name = template.render({ value: k1 }).toString()
              } else if (f.values[k1].name) {
                let t = OverpassLayer.twig.twig({ data: f.values[k1].name, autoescape: true })
                f.values[k1].name = t.render({}).toString()
              }
            }
          }
        }
      }
    }

    let masterOptions = {}
    if (Object.keys(this.data).length > 1) {
      masterOptions = {
        'type': 'form_chooser',
        'button:add_element': '-- ' + lang('choose_filter') + ' --',
        'order': false
      }
    }

    this.formFilter = new form('filter-' + this.master.id, this.data, masterOptions)
    this.formFilter.show(this.domFilter)
    this.formFilter.onchange = function () {
      let param = JSON.parse(JSON.stringify(this.formFilter.get_data()))

      this.applyParam(param)

      this.master.layer.check_update_map()
      state.update()
    }.bind(this)

    this.master.on('setParam', this.setParam.bind(this))
    this.master.on('applyParam', this.applyParam.bind(this))
    this.master.on('open', this.openCategory.bind(this))
    this.master.on('stateGet', this.stateGet.bind(this))
  }

  setParam (param) {
    this.formFilter.set_data(param)
  }

  applyParam (param) {
    this.additionalFilter = []
    let kvFilter = []

    for (var k in param) {
      if (param[k] === null) {
        continue
      }

      var d = this.data[k]

      if ('values' in d && param[k] in d.values && typeof d.values[param[k]] === 'object' && 'query' in d.values[param[k]]) {
        let f = new Filter(d.values[param[k]].query)
        this.additionalFilter.push(f.def)
        continue
      }

      var v  = {
        key: 'key' in d ? d.key : k,
        value: param[k],
        op: '='
      }

      if ('op' in d) {
        if (d.op === 'has_key_value') {
          v = {
            key: param[k],
            op: 'has_key'
          }
        } else {
          v.op = d.op
        }
      }

      kvFilter.push(v)
    }

    if (kvFilter.length) {
      this.additionalFilter.push(kvFilter)
    }

    if (this.additionalFilter.length === 0) {
      this.additionalFilter = []
    } else if (this.additionalFilter.length === 1) {
      this.additionalFilter = this.additionalFilter[0]
    } else {
      this.additionalFilter = { and: this.additionalFilter }
    }

    this.master.layer.options.queryOptions.filter = this.additionalFilter

    this.tabFilter.select()
  }

  openCategory () {
    this.formFilter.resize()
  }

  stateGet (param) {
    let data = this.formFilter.get_data()

    for (var k in data) {
      if (data[k]) {
        param[k] = data[k]
      }
    }
  }
}

register_hook('category-overpass-init', (category) => {
  if (category.data.filter) {
    new CategoryOverpassFilter(category)
  }
})
