import {Component, Directive, View, ElementRef, Inject, forwardRef, Injector, bind} from 'angular2/angular2';

import {Ion} from '../ion';
import {IonicConfig} from '../../config/config';
import {ViewController} from '../view/view-controller';
import {IonicComponent} from '../../config/annotations';
import {PaneAnchor, PaneContentAnchor, NavBarContainer} from './anchors';

/**
 * TODO
 */
export class PaneController {
  /**
   * TODO
   * @param {ViewController} viewCtrl  TODO
   */
  constructor(viewCtrl: ViewController) {
    this.panes = [];
    this.viewCtrl = viewCtrl;

    this.bindings = Injector.resolve([
      bind(ViewController).toValue(viewCtrl)
    ]);
  }

  /**
   * TODO
   * @param {TODO} nav  TODO
   * @param {Function} nav  TODO
   */
  get(itemStructure, callback) {
    // this gets or creates the Pane which similar nav items live in
    // Nav items with just a navbar/content would all use the same Pane
    // Tabs and view's without a navbar would get a different Panes

    let key = itemStructure.key;
    let viewCtrl = this.viewCtrl;
    let pane = this.panes[this.panes.length - 1];

    if (pane && pane.key === key) {
      // the last pane's structure is the same as the one the item needs to go in
      callback(pane);

    } else {
      // create a new nav pane
      viewCtrl.loader.loadNextToLocation(Pane, viewCtrl.anchorElementRef(), this.bindings).then((componentRef) => {

        // get the pane reference
        pane = this.newPane;
        this.newPane = null;

        let sectionAnchorElementRef = pane && pane.sectionAnchorElementRef;
        if (!sectionAnchorElementRef) {
          return callback();
        }

        pane.key = key;
        pane.dispose = () => {
          componentRef.dispose();
          this.panes.splice(this.panes.indexOf(pane), 1);
        };

        this.panes.push(pane);

        let promises = [];
        let sectionsToAdd = [];

        // decide which sections should be added to this Pane, ie: nav bars, footers, etc.
        // add only the sections it needs
        if (itemStructure.navbar) {
          sectionsToAdd.push(NavBarContainer);
        }

        // add the sections which this type of Pane requires
        sectionsToAdd.forEach(SectionClass => {
          // as each section is compiled and added to the Pane
          // the section will add a reference to itself in the Pane's sections object
          promises.push(
            viewCtrl.loader.loadNextToLocation(SectionClass, sectionAnchorElementRef)
          );
        });

        // wait for all of the sections to resolve
        Promise.all(promises).then(() => {
          callback(pane);
        }, err => {
          console.error(err)
        });

      }, loaderErr => {
        console.error(loaderErr);

      }).catch(err => {
        console.error(err);
      });

    }
  }

  add(pane) {
    this.newPane = pane;
  }

}

@IonicComponent({
  selector: 'ion-pane',
  classId: 'nav',
  host: {
    '[style.z-index]': 'zIndex',
  }
})
@View({
  template: `
    <template pane-anchor></template>
    <section class="content-container">
      <template content-anchor></template>
    </section>
  `,
  directives: [PaneAnchor, PaneContentAnchor]
})
export class Pane extends Ion {
  constructor(
    @Inject(forwardRef(() => ViewController)) viewCtrl: ViewController,
    elementRef: ElementRef,
    ionicConfig: IonicConfig
  ) {
    super(elementRef, ionicConfig);
    viewCtrl.panes.add(this);
    this.totalItems = 0;
    this.zIndex = ++viewCtrl.zIndexes;
  }

}