import {Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {animate, keyframes, query, stagger, style, transition, trigger} from '@angular/animations';
import {Constants, Warnings} from './utils/constants';
import {IListDataSource} from './utils/list-data-source.model';

@Component({
  selector: 'mat-list-touch',
  templateUrl: './mat-list-touch.component.html',
  styleUrls: ['./mat-list-touch.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':leave', [
          stagger(100, [
            animate('0s', style({opacity: '0'})),
            animate('0.2s', style({height: '0px', opacity: '0', display: 'none'}))
          ])
        ], {optional: true})
      ])
    ]),
    trigger('slideRow', [
      transition('* => *', animate(100, keyframes([
          style({left: '*', offset: 0}),
          style({left: '0', offset: 1}),
        ])
      ))
    ])
  ]
})
export class MatListTouchComponent implements OnInit {
  @Input() swipeThreshold?: number = Constants.DEFAULT_THRESHOLD;
  @Input() swipeLimit?: number = Constants.DEFAULT_LIMIT;
  @Input() multiLine = true;
  @Input() icon = false;
  @Input() avatar = false;
  @Input() leftColor = 'green';
  @Input() leftIcon = 'check';
  @Input() rightColor = 'red';
  @Input() rightIcon = 'not_interested';
  @Input() defaultSwipeColor = 'gray';
  currentSwipeColor = this.defaultSwipeColor;

  @Input() silenceWarnings = false;

  @Input() dataSource: IListDataSource<any>[];
  @Output() swipeLeftAction = new EventEmitter<any>();
  @Output() swipeRightAction = new EventEmitter<any>();
  @Output() tapAction = new EventEmitter<any>();

  lastAnimatedIndex: number = null;

  ngOnInit() {
    this.resetSwipeList();
  }

  resetSwipeList(): void {
    this.setThreshold();
  }

  setThreshold(): void {
    if (this.swipeThreshold < Constants.MIN_OFFSET || this.swipeThreshold > Constants.MAX_OFFSET) {
      if (this.swipeThreshold > Constants.MAX_OFFSET) {
        this.logWarnings(Warnings.MAX_OFFSET_EXCEEDED,
          `${Warnings.ADDING_DEFAULT_SLIDE_THRESHOLD} ${Constants.DEFAULT_THRESHOLD}%.`);
      }
      if (this.swipeThreshold < Constants.MIN_OFFSET || this.swipeThreshold === Constants.MIN_OFFSET) {
        this.logWarnings(Warnings.ZERO_SLIDE_THRESHOLD_NOT_ALLOWED,
          `${Warnings.ADDING_DEFAULT_SLIDE_THRESHOLD} ${Constants.DEFAULT_THRESHOLD}%.`);
      }
      this.swipeThreshold = Constants.DEFAULT_THRESHOLD;
    }
    if (this.swipeLimit < this.swipeThreshold) {
      this.swipeLimit = 100 - this.swipeThreshold;
      this.logWarnings(Warnings.LIMIT_TOO_LOW);
    }

  }

  panMoveEvent(action, elementRef): void {
    const offset = action.deltaX;
    if (Math.abs(action.deltaX) < this.swipeLimit) {
      elementRef.style.left = action.deltaX + 'px';
    } else {
      if (action.deltaX > 0) {
        elementRef.style.left = this.swipeLimit + 'px';
      } else {
        elementRef.style.left = -this.swipeLimit + 'px';

      }
    }
    if (offset > this.swipeThreshold) {
      this.currentSwipeColor = this.leftColor;
    } else if (offset < -this.swipeThreshold) {
      this.currentSwipeColor = this.rightColor;
    } else {
      this.currentSwipeColor = this.defaultSwipeColor;
    }
  }

  panEndEvent(action, index, elementRef): void {
    if (action.deltaX > this.swipeThreshold) {
      this.emitLeftAction(index);
    } else if (action.deltaX < -this.swipeThreshold) {
      this.emitRightAction(index);
    }
    this.lastAnimatedIndex = index;
  }

  tapEvent(index) {
    const tapItem = this.dataSource[index];
    if (this.tapAction.observers) {
      this.tapAction.emit(tapItem);
    }
  }

  slideComplete(event): void {
    event.element.style.left = '0px';
    this.lastAnimatedIndex = null;
  }

  emitLeftAction(index) {
    const actionItem = this.dataSource[index];
    if (this.swipeLeftAction.observers) {
      this.swipeLeftAction.emit(actionItem);
    }
  }

  emitRightAction(index) {
    const actionItem = this.dataSource[index];
    if (this.swipeRightAction.observers) {
      this.swipeRightAction.emit(actionItem);
    }
  }

  logWarnings(warningFor: string, extraMessage?: string): void {
    if (!this.silenceWarnings) {
      switch (warningFor) {
        case Warnings.SLIDE_THRESHOLD_NOT_FOUND:
        case Warnings.ZERO_SLIDE_THRESHOLD_NOT_ALLOWED:
        case Warnings.MAX_OFFSET_EXCEEDED:
        case Warnings.INVALID_SLIDE_THRESHOLD_NOT_ALLOWED:
          extraMessage ? console.warn(this.getConstValue(warningFor)) : console.warn(this.getConstValue(warningFor), extraMessage);
          break;
      }
    }
  }

  getConstValue(constantName: string): string {
    return Warnings[constantName];
  }
}
